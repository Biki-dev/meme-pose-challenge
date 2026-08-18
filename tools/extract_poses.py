#!/usr/bin/env python3
"""
Interactive meme pose extractor using MediaPipe Tasks API.
Usage: python extract_poses.py path/to/meme-video.mp4
"""

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode
import json
import sys
import os
import urllib.request
import numpy as np   # needed for blank image

# ---------- Download model if not present ----------
MODEL_FILE = "pose_landmarker_lite.task"
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"

def ensure_model():
    if not os.path.exists(MODEL_FILE):
        print(f"Downloading model from {MODEL_URL} ...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_FILE)
        print("Model downloaded.")

ensure_model()

# ---------- Initialise PoseLandmarker ----------
# The correct argument name is 'output_segmentation_masks' (not 'output_segmentations').
options = PoseLandmarkerOptions(
    base_options=python.BaseOptions(model_asset_path=MODEL_FILE),
    running_mode=RunningMode.IMAGE,
    num_poses=1,
    min_pose_detection_confidence=0.5,
    min_pose_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    output_segmentation_masks=False,   # <-- fixed argument name
)
landmarker = PoseLandmarker.create_from_options(options)

# ---------- State ----------
captured_poses = []   # list of {id, name, landmarks}
video_path = None
cap = None
frame = None
detection_result = None
paused = False
pose_names = ['a', 'b', 'c', 'd', 'e']  # up to 5 poses

def process_frame(frame):
    """Run pose detection on a BGR frame, return detection result."""
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    return landmarker.detect(mp_image)

def normalize_landmarks(pose_landmarks, image_shape):
    """
    Normalise landmarks: hip‑centre translation, shoulder‑width scaling.
    Returns list of dicts with keys: x, y, z, visibility.
    """
    h, w, _ = image_shape
    lm_list = [{'x': lm.x, 'y': lm.y, 'z': lm.z, 'visibility': lm.visibility}
               for lm in pose_landmarks]

    # Hip centre (landmarks 23 and 24)
    hip_l = lm_list[23]
    hip_r = lm_list[24]
    if hip_l['visibility'] < 0.5 or hip_r['visibility'] < 0.5:
        return None

    hip_center_x = (hip_l['x'] + hip_r['x']) / 2
    hip_center_y = (hip_l['y'] + hip_r['y']) / 2

    # Shoulder width (landmarks 11 and 12)
    shoulder_l = lm_list[11]
    shoulder_r = lm_list[12]
    if shoulder_l['visibility'] < 0.5 or shoulder_r['visibility'] < 0.5:
        return None
    sw = ((shoulder_l['x'] - shoulder_r['x'])**2 +
          (shoulder_l['y'] - shoulder_r['y'])**2)**0.5
    scale = sw if sw > 0.01 else 0.3

    norm_lm = []
    for lm in lm_list:
        if lm['visibility'] < 0.5:
            norm_lm.append({'x': 0.0, 'y': 0.0, 'z': 0.0, 'visibility': 0.0})
        else:
            norm_lm.append({
                'x': (lm['x'] - hip_center_x) / scale,
                'y': (lm['y'] - hip_center_y) / scale,
                'z': lm['z'] if lm['z'] else 0.0,
                'visibility': lm['visibility']
            })
    return norm_lm

def draw_pose_on_frame(frame, pose_landmarks):
    """Draw skeleton using OpenCV (simple circles + lines)."""
    if not pose_landmarks:
        return frame
    h, w, _ = frame.shape
    connections = [
        (11,12), (11,13), (13,15), (15,17), (15,19), (15,21),
        (12,14), (14,16), (16,18), (16,20), (16,22),
        (11,23), (23,25), (25,27), (27,29), (29,31),
        (12,24), (24,26), (26,28), (28,30), (30,32),
        (0,1), (1,2), (2,3), (3,7), (0,4), (4,5), (5,6), (6,8)
    ]
    # Draw lines
    for i, j in connections:
        if i >= len(pose_landmarks) or j >= len(pose_landmarks):
            continue
        p1 = pose_landmarks[i]
        p2 = pose_landmarks[j]
        if p1.visibility < 0.5 or p2.visibility < 0.5:
            continue
        x1, y1 = int(p1.x * w), int(p1.y * h)
        x2, y2 = int(p2.x * w), int(p2.y * h)
        cv2.line(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
    # Draw points
    for lm in pose_landmarks:
        if lm.visibility < 0.5:
            continue
        x, y = int(lm.x * w), int(lm.y * h)
        cv2.circle(frame, (x, y), 3, (0, 255, 0), -1)
    return frame

def capture_pose(pose_landmarks, image_shape):
    """Capture and normalise the current pose, add to list."""
    if not pose_landmarks:
        print("❌ No pose detected.")
        return False

    norm_lm = normalize_landmarks(pose_landmarks, image_shape)
    if norm_lm is None:
        print("❌ Hips or shoulders not visible. Choose a better frame.")
        return False

    next_idx = len(captured_poses)
    if next_idx >= len(pose_names):
        print("⚠️ Max poses (5) reached. Use 'R' to reset.")
        return False

    label = input(f"Enter label for pose {pose_names[next_idx]} (e.g. 'look', 'point'): ").strip()
    if not label:
        label = f"pose_{pose_names[next_idx]}"

    captured_poses.append({
        'id': f"pose_{pose_names[next_idx]}",
        'name': label,
        'landmarks': norm_lm
    })
    print(f"✅ Captured pose '{label}' ({len(captured_poses)} total)")
    return True

def main():
    global cap, frame, paused, detection_result

    if len(sys.argv) < 2:
        print("Usage: python extract_poses.py <video_file>")
        sys.exit(1)

    video_path = sys.argv[1]
    if not os.path.exists(video_path):
        print(f"File not found: {video_path}")
        sys.exit(1)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Cannot open video.")
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0
    print(f"Loaded: {video_path} ({duration:.1f}s, {total_frames} frames)")
    print("\nControls:")
    print("  SPACE      : Play/Pause")
    print("  C          : Capture current pose")
    print("  R          : Reset all captured poses")
    print("  ← / →      : Seek backward/forward 1 second")
    print("  Q          : Quit and export JSON")

    paused = False
    while True:
        if not paused:
            ret, frame = cap.read()
            if not ret:
                # Loop video
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            # Process
            detection_result = process_frame(frame)
            display = frame.copy()
            if detection_result.pose_landmarks:
                pose_lms = detection_result.pose_landmarks[0]
                display = draw_pose_on_frame(display, pose_lms)
            # Info overlay
            cv2.putText(display, f"Poses: {len(captured_poses)}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)
            cv2.putText(display, "SPACE=pause C=capture R=reset Q=quit", (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200,200,200), 1)
            cv2.imshow("Pose Extractor", display)

        else:  # paused
            if frame is not None:
                display = frame.copy()
                if detection_result and detection_result.pose_landmarks:
                    display = draw_pose_on_frame(display, detection_result.pose_landmarks[0])
                cv2.putText(display, "PAUSED", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
                cv2.imshow("Pose Extractor", display)
            else:
                # use numpy to create blank image
                cv2.imshow("Pose Extractor", np.zeros((480,640,3), dtype=np.uint8))

        key = cv2.waitKey(30) & 0xFF

        if key == ord('q'):
            break
        elif key == ord(' '):
            paused = not paused
        elif key == ord('c'):
            if frame is None:
                print("No frame loaded.")
                continue
            # If paused, re-process the current frame
            if paused and frame is not None:
                detection_result = process_frame(frame)
            if detection_result and detection_result.pose_landmarks:
                capture_pose(detection_result.pose_landmarks[0], frame.shape)
            else:
                print("❌ No pose in current frame.")
        elif key == ord('r'):
            captured_poses.clear()
            print("🗑️ Cleared all captured poses.")
        elif key == 81:  # left arrow
            cur = cap.get(cv2.CAP_PROP_POS_FRAMES)
            new = max(0, cur - int(fps))
            cap.set(cv2.CAP_PROP_POS_FRAMES, new)
            ret, frame = cap.read()
            if ret:
                detection_result = process_frame(frame)
            paused = True
        elif key == 83:  # right arrow
            cur = cap.get(cv2.CAP_PROP_POS_FRAMES)
            new = min(total_frames - 1, cur + int(fps))
            cap.set(cv2.CAP_PROP_POS_FRAMES, new)
            ret, frame = cap.read()
            if ret:
                detection_result = process_frame(frame)
            paused = True

    # ---------- Export ----------
    if captured_poses:
        base = os.path.splitext(os.path.basename(video_path))[0]
        json_data = {
            "id": base,
            "title": base.replace('-', ' ').upper(),
            "referencePoses": captured_poses
        }
        out_file = f"{base}.json"
        with open(out_file, 'w') as f:
            json.dump(json_data, f, indent=2)
        print(f"✅ Exported {len(captured_poses)} poses to {out_file}")
    else:
        print("No poses captured. Nothing exported.")

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
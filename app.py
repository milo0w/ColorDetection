from flask import Flask, render_template, Response, jsonify
import cv2
import json
import threading
from color_detection import ColorDetector

app = Flask(__name__)
detector = ColorDetector()

# Global variables
camera = None
detection_active = True
detection_stats = {'red': 0, 'yellow': 0, 'total_frames': 0}

def init_camera():
    """Initialize camera"""
    global camera
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        print("Warning: Could not open camera")

def generate_frames():
    """Generate video frames for streaming"""
    global detection_active, detection_stats
    
    while True:
        if camera is None:
            break
            
        ret, frame = camera.read()
        if not ret:
            break
        
        # Flip frame horizontally
        frame = cv2.flip(frame, 1)
        
        if detection_active:
            # Process frame for color detection
            processed_frame, detections = detector.process_frame(frame)
            
            # Update stats
            detection_stats['red'] = detections['red']
            detection_stats['yellow'] = detections['yellow']
            detection_stats['total_frames'] += 1
        else:
            processed_frame = frame
        
        # Encode frame to JPEG
        ret, buffer = cv2.imencode('.jpg', processed_frame)
        if ret:
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    return Response(generate_frames(), 
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/toggle_detection')
def toggle_detection():
    """Toggle color detection on/off"""
    global detection_active
    detection_active = not detection_active
    return jsonify({'status': 'active' if detection_active else 'inactive'})

@app.route('/stats')
def stats():
    """Get detection statistics"""
    return jsonify(detection_stats)

if __name__ == '__main__':
    init_camera()
    app.run(debug=True, threaded=True)
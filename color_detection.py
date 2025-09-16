import cv2
import numpy as np

class ColorDetector:
    def __init__(self):
        self.color_ranges = {
            'red': [
                {'lower': np.array([0, 100, 100]), 'upper': np.array([10, 255, 255])},
                {'lower': np.array([160, 100, 100]), 'upper': np.array([179, 255, 255])}
            ],
            'yellow': [
                {'lower': np.array([20, 120, 120]), 'upper': np.array([35, 255, 255])}
            ]
        }
        self.draw_colors = {
            'red': (0, 0, 255),
            'yellow': (0, 255, 255)
        }

    def detect_color(self, frame, color_name):
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for color_range in self.color_ranges[color_name]:
            color_mask = cv2.inRange(hsv, color_range['lower'], color_range['upper'])
            mask = cv2.bitwise_or(mask, color_mask)
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        return mask, contours

    def draw_detections(self, frame, contours, color_name, min_area=500):
        detection_count = 0
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > min_area:
                x, y, w, h = cv2.boundingRect(contour)
                cv2.rectangle(frame, (x, y), (x + w, y + h), self.draw_colors[color_name], 2)
                label = f"{color_name.upper()}: {int(area)}"
                cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, self.draw_colors[color_name], 2)
                detection_count += 1
        return detection_count

    def process_frame(self, frame):
        result_frame = frame.copy()
        detections = {'red': 0, 'yellow': 0}
        red_mask, red_contours = self.detect_color(frame, 'red')
        detections['red'] = self.draw_detections(result_frame, red_contours, 'red')
        yellow_mask, yellow_contours = self.detect_color(frame, 'yellow')
        detections['yellow'] = self.draw_detections(result_frame, yellow_contours, 'yellow')
        info_text = f"Red: {detections['red']} | Yellow: {detections['yellow']}"
        cv2.putText(result_frame, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        return result_frame, detections

def main():
    detector = ColorDetector()
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open camera")
        return
    print("Color Detection Started! (Press 'q' to quit)")
    detect_red = True
    detect_yellow = True
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.flip(frame, 1)
        if detect_red or detect_yellow:
            processed_frame, detections = detector.process_frame(frame)
        else:
            processed_frame = frame
        instructions = [
            "Press 'q' to quit",
            "Press 'r' to toggle red detection",
            "Press 'y' to toggle yellow detection"
        ]
        for i, instruction in enumerate(instructions):
            cv2.putText(processed_frame, instruction, (10, frame.shape[0] - 60 + i * 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.imshow('Color Detection - RED & YELLOW', processed_frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('r'):
            detect_red = not detect_red
            print(f"Red detection: {'ON' if detect_red else 'OFF'}")
        elif key == ord('y'):
            detect_yellow = not detect_yellow
            print(f"Yellow detection: {'ON' if detect_yellow else 'OFF'}")
    cap.release()
    cv2.destroyAllWindows()
    print("Color Detection Stopped!")

if __name__ == "__main__":
    main()

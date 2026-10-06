"""Measure the locally downloaded reference; not part of app/runtime assets."""
import cv2
import numpy as np
import json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
cap=cv2.VideoCapture(str(root/'artifacts/instagram-reference.mp4'))
fps=cap.get(cv2.CAP_PROP_FPS)
data=[]
frame_index=0
while True:
    ok,frame=cap.read()
    if not ok:break
    t=frame_index/fps
    frame_index+=1
    if frame_index%max(1,round(fps/10)):continue
    frame=cv2.resize(frame,(540,960))
    roi=frame[245:745]
    hsv=cv2.cvtColor(roi,cv2.COLOR_BGR2HSV)
    circles=cv2.HoughCircles(cv2.cvtColor(roi,cv2.COLOR_BGR2GRAY),cv2.HOUGH_GRADIENT,1,17,param1=70,param2=13,minRadius=8,maxRadius=12)
    balls=[]
    if circles is not None:
        for x,y,r in circles[0]:
            ix,iy=round(x),round(y)
            if ix<5 or iy<5 or ix>=535 or iy>=495:continue
            pixel=np.median(hsv[iy-3:iy+4,ix-3:ix+4].reshape(-1,3),axis=0)
            if pixel[1]<95 or pixel[2]<45 or pixel[2]>200:continue
            balls.append(dict(x=round(float(x),1),y=round(float(y+245),1),radius=round(float(r),1),hue=round(float(pixel[0])*2)))
    # Grey ice excludes saturated balls, particles and the coloured wall.
    ice=((hsv[:,:,1]<65)&(hsv[:,:,2]>55)&(hsv[:,:,2]<130)).astype(np.uint8)*255
    ice=cv2.morphologyEx(ice,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    data.append(dict(t=round(t,3),balls=balls,icePixels=int(np.count_nonzero(ice))))
    if abs(t-round(t))<.04 and round(t)%10==0:print(round(t),len(balls),flush=True)
cap.release()
(root/'artifacts/reference-measurements.json').write_text(json.dumps(dict(fps=fps,frames=data)),encoding='utf-8')
print('Saved',len(data),'measured frames.',flush=True)

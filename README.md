## Web Camera 錄製工具

透過 Media Capture and Streams API 存取使用者的 Web Camera

在 Camera 畫面上疊加了 Canvas

使用者可以對 Camera 和 Canvas 畫面放大、縮小、拖放等...

可以透過 Canvas 繪製內容、擦除內容、上一步、下一步...

使用者在 Canvas 上所畫的繪製紀錄和 Camera 畫面可以被一起錄製起來

### 影片

<iframe src="https://drive.google.com/file/d/1uZPHXPNT_XMK8NigbHXdPFiJaXq_1hoN/preview" width="640" height="480"></iframe>

### 問題紀錄

#### 當透過 Mousemove 繪製線條時出現鋸齒

當我們的滑鼠移動過快，或是系統處於一個比較繁忙的狀態的時候，瀏覽器的 mousemove event 給出的座標點的間距會變大

如果用一般的跟隨滑鼠 evnet 座標繪製線條的方法來做繪製，就會出現像是鋸齒的樣子


```javascript
ctx.beginPath();
ctx.moveTo(prevX), prevY);
ctx.lineTo(currentX, currentY);
ctx.stroke();
ctx.closePath();
```

<video autoplay="autoplay" loop=ture width=768 src="https://i.imgur.com/vlnPR34.mp4"/></video>

##### 解決方式

參考解答:https://stackoverflow.com/a/10568043

使用文中的 drawPoints() 用 ctx.quadraticCurveTo 繪製二次曲線

當 mousemove 觸發時將每個 mousemove 產生的座標點存到 array ，然後把 array 中的座標點做繪製曲線

但是如果這樣做會造成每次 mousemove event 觸發的時候，都要從頭到尾將座標點重新繪製效率不太好

而且每次重繪製，上一次的紀錄和下一次的繪製會重疊，如果不清除上一個繪製的紀錄會造成明顯的毛邊，因為每次做二次曲線的座標都不一樣，會逐漸增加

而文中的方法是每次 event 觸發繪製時都會清除畫布，這樣效率其實不太好，尤其畫布的大小如果太大時

<video autoplay="autoplay" loop=ture width=768 src="https://i.imgur.com/OOYywtx.mp4"/></video>

具體的解決方法，每次 mousemove 一樣把座標存到 array

每次進入 mousemove evnet handle 裡面 array 每數量累積一定的量

就將累積的那部分座標繪製二次曲線，而不是每個 move event 都會從頭到尾重新繪製。

ex. 每次累積5個 mousemove 座標點，就做一次繪製曲線
```javascript
let prev = 0,step = 5,canvasStack=[];
function onMouseMove(e) {
  canvasStack.push({ x: e.offsetX, y: e.offsetY });
  if ( canvasStack.length % step === 0 ){
      let currentEnd = pointStack.length, currentStart = prev;
      drawPoints(pointStack.slice(currentStart,currentEnd),ctx); //draw smooth line
  };  
  prev += step;  
}
```


解決結果

黑色線條為原本的線條，紅色線條為做二次曲線後繪製出的線條

當然每一定量形成的曲線和曲線之間可能還是會產生有稜有角的問題，

因為並不是所有的點從頭到尾做二次曲線

<video autoplay="autoplay" loop=ture width=768 src="https://i.imgur.com/iVp242f.mp4"/></video>

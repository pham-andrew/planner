To use the map features added to the app you must install Leaflet and React-Leaflet in the frontend:

```bash
cd frontend
npm install react-leaflet leaflet
```

Also include Leaflet CSS in your app (e.g., in `index.css` or `index.js`):

```css
@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
```

If markers do not appear correctly, add the following configuration to set Leaflet's default icon paths (example for CRA, put in `index.js`):

```javascript
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})
```

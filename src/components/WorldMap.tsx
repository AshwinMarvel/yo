@@ .. @@
 import React, { useEffect, useRef } from 'react';
 import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
 import L from 'leaflet';
 import { BoatData } from '../App';
 import 'leaflet/dist/leaflet.css';
 
-// Fix for default markers in react-leaflet
-delete (L.Icon.Default.prototype as any)._getIconUrl;
-L.Icon.Default.mergeOptions({
-  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
-  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
-  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
-});
+// Fix for default markers in react-leaflet
+if (L.Icon.Default.prototype._getIconUrl) {
+  delete (L.Icon.Default.prototype as any)._getIconUrl;
+  L.Icon.Default.mergeOptions({
+    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
+    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
+    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
+  });
+}
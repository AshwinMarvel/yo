@@ .. @@
         <div className="mt-6 p-4 bg-blue-50 rounded-lg">
           <h3 className="font-semibold text-blue-900 mb-2">Simulated Map View</h3>
-          <div className="aspect-video bg-blue-100 rounded-lg flex items-center justify-center relative overflow-hidden">
+          <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300"></div>
             <div className="relative z-10 text-center">
               <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-2 animate-pulse"></div>
               <div className="text-sm text-blue-800 font-medium">Current Position</div>
               <div className="text-xs text-blue-600 mt-1">
                 {formatCoordinate(boatData.location.lat)}, {formatCoordinate(boatData.location.lng)}
               </div>
             </div>
-            <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
+            <div className="absolute top-4 left-4 bg-red-400 text-white px-2 py-1 rounded text-xs font-medium shadow-md">
               Restricted Zone
             </div>
             <div className="absolute bottom-4 right-4 bg-green-400 text-green-900 px-2 py-1 rounded text-xs font-medium">
               Safe Zone
             </div>
           </div>
         </div>
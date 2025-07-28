@@ .. @@
     if (!contactInfo.trim()) {
       newErrors.contactInfo = 'Contact information is required';
-    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(contactInfo.trim().replace(/[-\s]/g, ''))) {
+    } else if (!/^[\+]?[1-9][\d\-\s]{7,15}$/.test(contactInfo.trim())) {
       newErrors.contactInfo = 'Please enter a valid phone number';
     }
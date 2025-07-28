@@ .. @@
   const handleSendMessage = (e: React.FormEvent) => {
     e.preventDefault();
     if (selectedBoat && messageText.trim()) {
       onSendMessage(selectedBoat, messageText.trim(), messagePriority);
       setMessageText('');
+      setSelectedBoat(''); // Reset selection after sending
     }
   };
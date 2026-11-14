/* খোলার সময় আধা-আঁকা পাতা (শুধু হেডার, ভেতর ফাঁকা) দেখা যেত, পরে পুরোটা আসত।
   এখন html-এ dr-boot থাকা পর্যন্ত পাতা লুকানো থাকে; সব UI স্ক্রিপ্ট (app/alarm/amol) চলার পর এই ফাইল চলে (defer ক্রম অনুযায়ী),
   ফন্ট লোড হলে লেখার মাপ আবার মিলিয়ে একবারে পুরো পাতা দেখানো হয়। index.html-এর ৩.৫ সেকেন্ডের টাইমার ব্যর্থ হলে নিজেই খুলে দেয়। */
(function () {
  var d = document.documentElement, done = false;
  function show() {
    if (done) return; done = true;
    try { window.dispatchEvent(new Event("resize")); } catch (e) { }
    requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.remove("dr-boot"); }); });
  }
  var fr = document.fonts && document.fonts.ready;
  if (fr && fr.then) { fr.then(show, show); setTimeout(show, 1200); } else show();
})();

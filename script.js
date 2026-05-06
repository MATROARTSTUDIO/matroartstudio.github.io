// Scroll animation
window.addEventListener("scroll", () => {
  document.querySelectorAll(".card, img").forEach(el => {
    let top = el.getBoundingClientRect().top;
    if(top < window.innerHeight - 100){
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }
  });
});

// Initial state
document.querySelectorAll(".card, img").forEach(el => {
  el.style.opacity = "0";
  el.style.transform = "translateY(40px)";
  el.style.transition = "0.6s ease";
});

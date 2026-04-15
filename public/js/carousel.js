/**
 * Office CMS - Photo Carousel Component
 * Supports: auto-advance, prev/next, dots, swipe, keyboard
 */

class Carousel {
  constructor(element) {
    this.el = element;
    this.slides = Array.from(element.querySelectorAll('.carousel__slide'));
    this.prevBtn = element.querySelector('.carousel__prev');
    this.nextBtn = element.querySelector('.carousel__next');
    this.dotsContainer = element.querySelector('.carousel__dots');
    this.counter = element.querySelector('.carousel__counter');

    this.current = 0;
    this.total = this.slides.length;
    this.autoAdvanceDelay = 4000;
    this.timer = null;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isTransitioning = false;

    if (this.total === 0) return;

    this.init();
  }

  init() {
    this.createDots();
    this.showSlide(0);
    this.bindEvents();
    this.startAutoAdvance();
  }

  createDots() {
    if (!this.dotsContainer || this.total <= 1) return;
    this.dotsContainer.innerHTML = '';
    this.dots = [];

    this.slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
      this.dots.push(dot);
    });
  }

  showSlide(index) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.slides[this.current].classList.remove('carousel__slide--active');
    if (this.dots) this.dots[this.current]?.classList.remove('carousel__dot--active');

    this.current = (index + this.total) % this.total;

    this.slides[this.current].classList.add('carousel__slide--active');
    if (this.dots) this.dots[this.current]?.classList.add('carousel__dot--active');

    if (this.counter) {
      this.counter.textContent = `${this.current + 1} / ${this.total}`;
    }

    // Reset transition lock after animation
    setTimeout(() => { this.isTransitioning = false; }, 550);
  }

  goTo(index) {
    this.stopAutoAdvance();
    this.showSlide(index);
    this.startAutoAdvance();
  }

  prev() {
    this.goTo(this.current - 1);
  }

  next() {
    this.goTo(this.current + 1);
  }

  startAutoAdvance() {
    if (this.total <= 1) return;
    this.stopAutoAdvance();
    this.timer = setInterval(() => this.showSlide(this.current + 1), this.autoAdvanceDelay);
  }

  stopAutoAdvance() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  bindEvents() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }

    // Touch/swipe support
    this.el.addEventListener('touchstart', e => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    this.el.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;

      // Only horizontal swipe (not vertical scroll)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) this.next();
        else this.prev();
      }
    }, { passive: true });

    // Keyboard support
    this.el.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    // Pause on hover
    this.el.addEventListener('mouseenter', () => this.stopAutoAdvance());
    this.el.addEventListener('mouseleave', () => this.startAutoAdvance());

    // Make focusable for keyboard
    if (!this.el.hasAttribute('tabindex')) {
      this.el.setAttribute('tabindex', '0');
    }
  }

  destroy() {
    this.stopAutoAdvance();
  }
}

// Auto-initialize all carousels on page
function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach(el => {
    if (!el._carousel) {
      el._carousel = new Carousel(el);
    }
  });
}

document.addEventListener('DOMContentLoaded', initCarousels);

// Export for use in other scripts
if (typeof module !== 'undefined') module.exports = { Carousel, initCarousels };

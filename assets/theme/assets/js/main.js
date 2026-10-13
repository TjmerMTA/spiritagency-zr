/**
 * Spirit Start — анимации без зависимостей.
 * Всё уважает prefers-reduced-motion.
 */
(function () {
	'use strict';

	var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function onReady(fn) {
		if ('loading' === document.readyState) {
			document.addEventListener('DOMContentLoaded', fn);
		} else {
			fn();
		}
	}

	onReady(function () {

		/* ---------- Шапка и прогресс чтения ---------- */
		var header = document.getElementById('sn-header');
		var progress = document.getElementById('sn-progress');
		var ticking = false;

		function onScroll() {
			if (ticking) {
				return;
			}
			ticking = true;

			window.requestAnimationFrame(function () {
				var y = window.scrollY || document.documentElement.scrollTop;

				if (header) {
					header.classList.toggle('sn-stuck', y > 30);
				}

				if (progress) {
					var max = document.documentElement.scrollHeight - window.innerHeight;
					progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
				}

				updateRoad();
				updateParallax(y);
				ticking = false;
			});
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });

		/* ---------- Мобильное меню ---------- */
		var burger = document.getElementById('sn-burger');
		var nav = document.getElementById('sn-nav');

		if (burger && nav) {
			burger.addEventListener('click', function () {
				var open = nav.classList.toggle('sn-open');
				burger.classList.toggle('sn-on', open);
				burger.setAttribute('aria-expanded', open ? 'true' : 'false');
				document.body.style.overflow = open ? 'hidden' : '';
			});

			nav.addEventListener('click', function (e) {
				if (e.target.closest('a')) {
					nav.classList.remove('sn-open');
					burger.classList.remove('sn-on');
					burger.setAttribute('aria-expanded', 'false');
					document.body.style.overflow = '';
				}
			});

			document.addEventListener('keydown', function (e) {
				if ('Escape' === e.key && nav.classList.contains('sn-open')) {
					burger.click();
				}
			});
		}

		/* ---------- Появление блоков ---------- */
		var revs = document.querySelectorAll('.sn-rev');

		if (reduced || !('IntersectionObserver' in window)) {
			revs.forEach(function (el) {
				el.classList.add('sn-in');
			});
		} else {
			var io = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add('sn-in');
						io.unobserve(entry.target);
					}
				});
			}, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });

			revs.forEach(function (el) {
				io.observe(el);
			});
		}

		/* ---------- Смена слов в заголовке ---------- */
		var rotator = document.getElementById('sn-rotator');

		if (rotator && !reduced) {
			var words = rotator.querySelectorAll('span');

			if (words.length > 1) {
				var current = 0;

				setInterval(function () {
					words[current].classList.remove('sn-vis');
					current = (current + 1) % words.length;
					words[current].classList.add('sn-vis');
				}, 2600);
			}
		}

		/* ---------- Счётчики ---------- */
		var counters = document.querySelectorAll('[data-count]');

		function runCounter(el) {
			var target = parseFloat(String(el.dataset.count).replace(/[^\d.]/g, ''));

			if (isNaN(target)) {
				el.textContent = el.dataset.count;
				return;
			}

			if (reduced) {
				el.textContent = el.dataset.count;
				return;
			}

			var started = null;
			var duration = 1400;

			function tick(now) {
				if (!started) {
					started = now;
				}

				var p = Math.min((now - started) / duration, 1);
				var eased = 1 - Math.pow(1 - p, 3);

				el.textContent = Math.round(target * eased).toLocaleString('uk-UA');

				if (p < 1) {
					window.requestAnimationFrame(tick);
				} else {
					el.textContent = el.dataset.count;
				}
			}

			window.requestAnimationFrame(tick);
		}

		if (counters.length) {
			if (!('IntersectionObserver' in window)) {
				counters.forEach(runCounter);
			} else {
				var cio = new IntersectionObserver(function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							runCounter(entry.target);
							cio.unobserve(entry.target);
						}
					});
				}, { threshold: 0.4 });

				counters.forEach(function (el) {
					cio.observe(el);
				});
			}
		}

		/* ---------- Дорожная карта: заливка линии ---------- */
		var road = document.getElementById('sn-road');
		var roadFill = document.getElementById('sn-road-fill');
		var steps = road ? road.querySelectorAll('.sn-step') : [];

		function updateRoad() {
			if (!road || !roadFill) {
				return;
			}

			var rect = road.getBoundingClientRect();
			var anchor = window.innerHeight * 0.55;
			var passed = anchor - rect.top;
			var ratio = Math.max(0, Math.min(1, passed / rect.height));

			roadFill.style.height = (ratio * 100) + '%';

			steps.forEach(function (step) {
				var dot = step.querySelector('.sn-step__dot');
				var dotTop = dot.getBoundingClientRect().top;
				step.classList.toggle('sn-done', dotTop < anchor);
			});
		}

		/* ---------- Параллакс световых пятен ---------- */
		var orbs = document.querySelectorAll('[data-par]');

		function updateParallax(y) {
			if (reduced || !orbs.length || y > window.innerHeight * 1.5) {
				return;
			}

			orbs.forEach(function (orb) {
				orb.style.translate = '0 ' + (y * parseFloat(orb.dataset.par)).toFixed(1) + 'px';
			});
		}

		/* ---------- Подсветка карточек за курсором ---------- */
		if (!reduced) {
			document.querySelectorAll('.sn-card').forEach(function (card) {
				card.addEventListener('pointermove', function (e) {
					var r = card.getBoundingClientRect();
					card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
					card.style.setProperty('--my', (e.clientY - r.top) + 'px');

					if (card.hasAttribute('data-tilt') && window.innerWidth > 900) {
						var rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
						var ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
						card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-3px)';
					}
				});

				card.addEventListener('pointerleave', function () {
					card.style.transform = '';
				});
			});
		}

		/* ---------- Аккордеоны: FAQ и мифы ---------- */
		function accordion(btnSelector, itemSelector, panelSelector) {
			document.querySelectorAll(btnSelector).forEach(function (btn) {
				btn.addEventListener('click', function () {
					var item = btn.closest(itemSelector);
					var panel = item.querySelector(panelSelector);
					var open = item.classList.toggle('sn-open');

					btn.setAttribute('aria-expanded', open ? 'true' : 'false');
					panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '';
				});
			});
		}

		accordion('.sn-faq__b', '.sn-faq__i', '.sn-faq__p');
		accordion('.sn-myth__q', '.sn-myth', '.sn-myth__a');

		/* ---------- Калькулятор дохода ---------- */
		var calc = document.getElementById('sn-calc');

		if (calc) {
			var hours = document.getElementById('sn-hours');
			var days = document.getElementById('sn-days');
			var outMin = calc.querySelector('[data-calc-min]');
			var outMax = calc.querySelector('[data-calc-max]');
			var outHours = calc.querySelector('[data-calc-hours]');
			var outDays = calc.querySelector('[data-calc-days]');
			var animMin = 0;
			var animMax = 0;
			var raf = null;

			function money(n) {
				return Math.round(n / 10) * 10;
			}

			function format(n) {
				return Math.round(n).toLocaleString('uk-UA').replace(/,/g, ' ');
			}

			function estimate() {
				var h = parseInt(hours.value, 10);
				var d = parseInt(days.value, 10);

				// База + вклад объёма съёмки + вклад регулярности публикаций.
				var base = 900 + h * 190 + d * 210;

				return { min: money(base), max: money(base * 1.42) };
			}

			function render() {
				var target = estimate();

				outHours.textContent = hours.value;
				outDays.textContent = days.value;

				if (reduced) {
					outMin.textContent = format(target.min);
					outMax.textContent = format(target.max);
					return;
				}

				if (raf) {
					window.cancelAnimationFrame(raf);
				}

				function step() {
					animMin += (target.min - animMin) * 0.18;
					animMax += (target.max - animMax) * 0.18;

					outMin.textContent = format(animMin);
					outMax.textContent = format(animMax);

					if (Math.abs(target.min - animMin) > 2 || Math.abs(target.max - animMax) > 2) {
						raf = window.requestAnimationFrame(step);
					} else {
						outMin.textContent = format(target.min);
						outMax.textContent = format(target.max);
					}
				}

				raf = window.requestAnimationFrame(step);
			}

			hours.addEventListener('input', render);
			days.addEventListener('input', render);

			var first = estimate();
			animMin = first.min;
			animMax = first.max;
			render();
		}

		/* ---------- Активный пункт меню ---------- */
		var sections = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
		var links = Array.prototype.slice.call(document.querySelectorAll('.sn-nav a[href*="#"]'));

		if (sections.length && links.length && 'IntersectionObserver' in window) {
			var spy = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) {
						return;
					}

					links.forEach(function (link) {
						if (link.parentElement) {
							link.parentElement.classList.toggle('sn-active', link.hash === '#' + entry.target.id);
						}
					});
				});
			}, { rootMargin: '-45% 0px -50% 0px' });

			sections.forEach(function (section) {
				spy.observe(section);
			});
		}

		onScroll();
	});
})();

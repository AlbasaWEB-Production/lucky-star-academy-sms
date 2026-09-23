'use strict';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
const closeMenu = () => {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  menuButton.querySelector('use').setAttribute('href', '#i-menu');
};
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuButton.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a, button')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.navigation')) closeMenu();
});
window.matchMedia('(min-width: 1021px)').addEventListener('change', closeMenu);

const dialog = document.querySelector('#info-dialog');
const emailAction = (subject, label = 'Email admissions') => ({
  label,
  href: `mailto:info@brightfuture.edu?subject=${encodeURIComponent(subject)}`
});
const layoutNotice = '<p class="notice">This is a website layout preview. Contact details are taken from the supplied design; online applications and bookings are not connected.</p>';
const programs = {
  early: { eyebrow: 'Ages 3–5', title: 'Early Years', content: '<p>A nurturing start for lifelong learners. Our Early Years program gives children the space to explore, play, and build confidence.</p><p>Language, early numeracy, creative activities, and social learning help every child take their first steps with curiosity and joy.</p>' },
  primary: { eyebrow: 'Grades 1–5', title: 'Primary School', content: '<p>Strong foundations open a world of possibility. Students build their skills in reading, writing, mathematics, and science through active, engaging learning.</p><p>Art, movement, collaboration, and opportunities to ask questions are part of every child’s journey.</p>' },
  middle: { eyebrow: 'Grades 6–8', title: 'Middle School', content: '<p>A place for growing minds to ask bigger questions. Students deepen their subject knowledge while developing independence, critical thinking, and a sense of responsibility.</p><p>Hands-on projects and collaborative learning help them connect what they know with the world around them.</p>' },
  high: { eyebrow: 'Grades 9–12', title: 'High School', content: '<p>Preparing thoughtful, confident young people for college and beyond. Rigorous learning is balanced with opportunities for leadership, creativity, and service.</p><p>Students are encouraged to discover their strengths and take ownership of the next chapter of their education.</p>' },
  clubs: { eyebrow: 'Campus life', title: 'More room to be yourself.', content: '<p>Some of the most memorable lessons happen beyond the classroom. Sports, creative pursuits, and shared interests help students discover new talents and build lasting friendships.</p><p>With 30+ clubs and activities featured in our school community, there is space for every student to explore what they love.</p>' }
};
const dialogPages = {
  ...programs,
  about: { eyebrow: 'Our story & values', title: 'Education with purpose.', content: '<p>Bright Future brings together academic ambition and the values that shape a good life: curiosity, kindness, integrity, and respect.</p><p>The school community in this design is built around five commitments: holistic education, expert educators, innovative learning, a global perspective, and a safe place to belong.</p><p>Every student deserves to feel known, supported, and encouraged to make a difference.</p>', action: { label: 'Explore our programs', dialog: 'programs' } },
  apply: { eyebrow: 'Admissions', title: 'Their bright future starts here.', content: '<p>Find the right learning environment for your child. Our admissions team can guide you through the next steps.</p><ol><li><strong>Explore the programs.</strong> Find the stage that suits your child.</li><li><strong>Get to know the school.</strong> Ask about the curriculum and arrange a visit.</li><li><strong>Request application details.</strong> Confirm availability, requirements, and fees with admissions.</li></ol>' + layoutNotice, action: emailAction('Admissions enquiry — Bright Future') },
  tour: { eyebrow: 'Visit Bright Future', title: 'See where they could thrive.', content: '<p>Discover the classrooms, outdoor spaces, and people that make a school feel like a community.</p><p>To enquire about a visit, include your preferred dates, your child’s age or grade, and the number of visitors in your email.</p>' + layoutNotice, action: emailAction('Campus tour enquiry — Bright Future', 'Enquire about a tour') },
  parent: { eyebrow: 'School community', title: 'Parent portal', content: '<p>The parent portal will provide access to school communications and student information.</p><p class="notice">A portal address has not been supplied for this layout. No login details are collected here.</p>', action: emailAction('Parent portal enquiry', 'Contact the school') },
  student: { eyebrow: 'School community', title: 'Student login', content: '<p>The student portal will provide access to learning resources and school information.</p><p class="notice">A student portal address has not been supplied for this layout. No login details are collected here.</p>', action: emailAction('Student portal enquiry', 'Contact the school') },
  programs: { eyebrow: 'Academics', title: 'Discover their next chapter.', content: '<div class="dialog-program-list">' + Object.entries(programs).map(([key, program]) => `<button data-dialog="${key}">${key === 'clubs' ? 'Beyond the Classroom' : program.title}<span>${program.eyebrow}</span></button>`).join('') + '</div>' }
};
let dialogOpener;
function openDialog(key, opener) {
  const page = dialogPages[key];
  if (!page) return;
  if (!dialog.open) dialogOpener = opener;
  document.querySelector('#dialog-eyebrow').textContent = page.eyebrow;
  document.querySelector('#dialog-title').textContent = page.title;
  document.querySelector('#dialog-content').innerHTML = page.content;
  const actions = document.querySelector('#dialog-actions');
  actions.replaceChildren();
  const action = page.action || (programs[key] ? { label: 'Enquire about admissions', dialog: 'apply' } : null);
  if (action) {
    const element = document.createElement(action.href ? 'a' : 'button');
    element.className = 'button button-gold';
    element.textContent = action.label;
    if (action.href) element.href = action.href;
    if (action.dialog) element.dataset.dialog = action.dialog;
    actions.append(element);
  }
  if (!dialog.open) dialog.showModal();
  document.body.style.overflow = 'hidden';
  dialog.scrollTop = 0;
  document.querySelector('.dialog-close').focus();
}
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-dialog]');
  if (trigger) openDialog(trigger.dataset.dialog, trigger);
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
  if (dialogOpener) dialogOpener.focus();
});

document.querySelector('#newsletter-form').addEventListener('submit', event => {
  event.preventDefault();
  const field = document.querySelector('#newsletter-email');
  if (!field.reportValidity()) return;
  document.querySelector('#newsletter-feedback').textContent = 'This preview is not connected to a newsletter service. Your email has not been submitted.';
});

document.querySelector('#year').textContent = new Date().getFullYear();
const heroImage = new Image();
heroImage.onload = () => document.querySelector('.hero-image').classList.add('ready');
heroImage.src = 'assets/hero-school.png';

if ('IntersectionObserver' in window) {
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
      }
    });
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
  navLinks.forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section) observer.observe(section);
  });
}

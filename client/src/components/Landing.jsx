import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Calculator,
  CheckCircle2,
  Github,
  GraduationCap,
  Linkedin,
  Menu,
  MessageSquareMore,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Twitter,
  Users,
  X,
  Zap,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const featureCards = [
  {
    icon: BookOpen,
    title: "Curriculum Hub",
    accent:
      "from-indigo-500/15 to-blue-500/10 text-indigo-600 dark:text-indigo-300",
    description:
      "Organize subjects, materials, and class resources in one secure space teachers and students can access anytime.",
    tag: "Academics",
  },
  {
    icon: Users,
    title: "Student Rosters",
    accent:
      "from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-300",
    description:
      "Manage enrollment, parent connections, and staff visibility without scattered spreadsheets or manual follow-up.",
    tag: "Administration",
    raised: true,
  },
  {
    icon: Calculator,
    title: "Auto Grading",
    accent:
      "from-purple-500/15 to-fuchsia-500/10 text-purple-600 dark:text-purple-300",
    description:
      "Capture scores, calculate totals instantly, and generate clean report outputs for students, parents, and school records.",
    tag: "Automation",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Create your school workspace",
    text: "Set up your institution, define roles, and prepare a structured digital environment in minutes.",
  },
  {
    step: "02",
    title: "Invite staff, students, and parents",
    text: "Onboard your school community securely with invite-based access and role-specific permissions.",
  },
  {
    step: "03",
    title: "Run academics from one portal",
    text: "Manage records, grading, communication, attendance, and learning resources in one connected system.",
  },
];

const trustItems = [
  "Role-based secure access",
  "Built for admins, teachers, students, and parents",
  "Academic records and reporting in one place",
];

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Principal",
    org: "Crestview Prep",
    initials: "SJ",
    accent: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    quote:
      "EduSync has transformed how our school communicates with parents and manages reporting. Tasks that used to take hours are now handled in one smooth workflow.",
  },
  {
    name: "David O.",
    role: "Senior Science Teacher",
    org: "Spark College",
    initials: "DO",
    accent:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    quote:
      "The built-in CBT and grading flow has been a game-changer. My students complete assessments faster, and results are ready without unnecessary manual work.",
  },
];

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
];

const Landing = () => {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggleTheme = () => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
      return;
    }

    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
    setIsDark(true);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f6f8fc] font-sans text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
      <AnimatePresence>
        {showTopBtn ? (
          <motion.button
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-[100] rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-white shadow-xl shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            aria-label="Back to top"
            title="Back to top"
          >
            <ArrowUp size={17} strokeWidth={2.5} />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-[-8%] top-[-4%] h-[26rem] w-[26rem] rounded-full bg-blue-300/30 blur-[120px] dark:bg-blue-900/20" />
        <div className="absolute right-[-8%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-fuchsia-300/20 blur-[140px] dark:bg-purple-900/20" />
        <div className="absolute bottom-[12%] left-[20%] h-[24rem] w-[24rem] rounded-full bg-indigo-300/20 blur-[120px] dark:bg-indigo-900/20" />
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_58%)] dark:bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.55),transparent_58%)]" />
      </div>

      <header className="relative z-50 px-4 pt-5 sm:px-6 lg:px-8">
        <motion.nav
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/60 bg-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-gray-800/70 dark:bg-gray-900/70 sm:px-5"
        >
          <Link
            to="/"
            className="flex items-center gap-2.5"
            aria-label="EduSync home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-lg shadow-blue-500/25">
              E
            </div>
            <div className="leading-none">
              <span className="text-lg font-black tracking-tight text-blue-600 dark:text-blue-400">
                Edu
              </span>
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                Sync.
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-semibold text-gray-600 transition hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label={`Toggle ${isDark ? "light" : "dark"} theme`}
              title="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              to="/login"
              className="rounded-full px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Log In
            </Link>

            <Link
              to="/register"
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700"
            >
              Get Started
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label={`Toggle ${isDark ? "light" : "dark"} theme`}
              title="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-full p-2.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </motion.nav>

        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto mt-3 w-full max-w-7xl rounded-3xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur-xl dark:border-gray-800/70 dark:bg-gray-900/90 md:hidden"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {item.label}
                  </a>
                ))}

                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Log In
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <main className="relative z-10">
        <section className="px-4 pb-14 pt-12 sm:px-6 md:pt-16 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mx-auto max-w-7xl"
          >
            <div className="mx-auto max-w-4xl text-center">
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/80 px-4 py-2 text-sm font-bold text-blue-600 shadow-sm backdrop-blur-md dark:border-blue-900/50 dark:bg-gray-900/70 dark:text-blue-300"
              >
                <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                EduSync 2.0 is now available
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="mt-7 text-5xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-6xl lg:text-7xl"
              >
                The modern way to
                <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                  {" "}
                  manage your school.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-gray-600 dark:text-gray-400 sm:text-lg"
              >
                Run academics, communication, records, and reporting from one
                unified school workspace built for administrators, teachers,
                students, and parents.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Link
                  to="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 sm:w-auto"
                >
                  Start for free
                  <ArrowRight size={18} />
                </Link>

                <a
                  href="#features"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-8 py-4 text-base font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-auto"
                >
                  Explore features
                </a>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                No credit card required. Get started in minutes.
              </motion.p>
            </div>

            <motion.div variants={fadeUp} className="mx-auto mt-12 max-w-6xl">
              <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-gray-800/70 dark:bg-gray-900/75">
                <div className="flex items-center justify-between border-b border-gray-200/80 px-5 py-4 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                    EduSync Dashboard Preview
                  </div>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[1.5rem] border border-gray-200 bg-[#f7f9ff] p-5 dark:border-gray-800 dark:bg-gray-950/70">
                    <div className="flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                      <div>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                          Admin overview
                        </p>
                        <h3 className="mt-1 text-2xl font-black text-gray-950 dark:text-white">
                          Your school at a glance
                        </h3>
                      </div>

                      <div className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-200">
                        <Sparkles size={16} className="text-blue-500" />
                        Live school activity
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      {[
                        { label: "Students", value: "1,248" },
                        { label: "Teachers", value: "84" },
                        { label: "Attendance", value: "96%" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900"
                        >
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {item.label}
                          </p>
                          <p className="mt-2 text-2xl font-black text-gray-950 dark:text-white">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          Active classes
                        </p>
                        <p className="mt-2 text-2xl font-black text-gray-950 dark:text-white">
                          36
                        </p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          Structured by level, subject, and assigned teachers.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          Reports ready
                        </p>
                        <p className="mt-2 text-2xl font-black text-gray-950 dark:text-white">
                          128
                        </p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          Results and summaries generated for faster parent
                          communication.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.5rem] border border-gray-200 bg-white p-5 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-2xl bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                          <MessageSquareMore size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                            Communication
                          </p>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            Everyone stays informed
                          </h4>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">
                        Keep academic updates, attendance alerts, and
                        school-wide communication inside one trusted portal.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                            Roster management
                          </p>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            Student records synced
                          </h4>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {[
                          "Parent-linked student profiles",
                          "Secure role-based access",
                          "Fast academic record lookup",
                        ].map((item) => (
                          <div
                            key={item}
                            className="flex items-center justify-center gap-3"
                          >
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500"
                            />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-gray-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-center text-white shadow-lg shadow-blue-500/20">
                      <div className="flex flex-col items-center gap-3">
                        <div>
                          <p className="text-sm font-semibold text-blue-100">
                            Teacher tools
                          </p>
                          <h4 className="mt-1 text-xl font-black">
                            Grading made faster
                          </h4>
                        </div>
                        <Calculator size={20} className="text-blue-100" />
                      </div>

                      <p className="mt-4 text-sm leading-7 text-blue-100">
                        Capture scores, automate totals, and deliver cleaner
                        reports without repetitive manual work.
                      </p>

                      <div className="mt-5 rounded-2xl bg-white/10 p-4">
                        <div className="flex items-center justify-between text-sm font-semibold">
                          <span>Report processing</span>
                          <span>Instant</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/15">
                          <div className="h-2 w-[84%] rounded-full bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.9 }}
              className="mx-auto mt-10 max-w-5xl border-y border-gray-200/70 py-6 dark:border-gray-800/70"
            >
              <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.28em] text-gray-400">
                Trusted by forward-thinking institutions
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {[
                  { icon: GraduationCap, name: "Academica" },
                  { icon: ShieldCheck, name: "Crestview Prep" },
                  { icon: Zap, name: "Spark College" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <Icon size={16} className="text-blue-500" />
                      {item.name}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section
          id="features"
          className="relative z-10 px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-blue-600 dark:text-blue-300">
                Core platform features
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-gray-950 dark:text-white sm:text-5xl">
                Everything you need to run a school.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-gray-600 dark:text-gray-400">
                Stop juggling spreadsheets, scattered chats, and paper-heavy
                workflows. EduSync brings your daily academic operations into
                one clear, efficient platform.
              </p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3"
            >
              {featureCards.map((card) => {
                const Icon = card.icon;

                return (
                  <motion.div
                    key={card.title}
                    variants={fadeUp}
                    whileHover={{ y: -8 }}
                    className={`rounded-[2rem] border border-white/70 bg-white/75 p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-2xl transition dark:border-gray-800/70 dark:bg-gray-900/70 ${
                      card.raised ? "md:-translate-y-8" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                        {card.tag}
                      </span>
                    </div>

                    <div
                      className={`mt-6 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} shadow-inner`}
                    >
                      <Icon size={26} />
                    </div>

                    <h3 className="mt-6 text-2xl font-black text-gray-950 dark:text-white">
                      {card.title}
                    </h3>

                    <p className="mt-4 text-sm font-medium leading-7 text-gray-600 dark:text-gray-400">
                      {card.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="relative z-10 px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-white/70 bg-white/70 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-gray-800/70 dark:bg-gray-900/60 sm:p-10 lg:p-14">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-indigo-600 dark:text-indigo-300">
                How it works
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-gray-950 dark:text-white sm:text-5xl">
                From setup to daily school operations.
              </h2>
              <p className="mt-5 text-base font-medium leading-8 text-gray-600 dark:text-gray-400">
                EduSync helps schools go from scattered tools to one connected
                digital system with a simple, role-aware workflow.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {howItWorks.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[2rem] border border-gray-200 bg-white p-7 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950/70"
                >
                  <div className="inline-flex rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-black text-white">
                    {item.step}
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-gray-950 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm font-medium leading-7 text-gray-600 dark:text-gray-400">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="testimonials"
          className="relative z-10 border-y border-blue-100 bg-blue-50/80 px-4 py-16 dark:border-gray-800 dark:bg-gray-900/80 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-blue-600 dark:text-blue-300">
                Trusted by school leaders
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-gray-950 dark:text-white sm:text-5xl">
                Loved by educators and administrators.
              </h2>
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
              {testimonials.map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ y: -6 }}
                  className="rounded-[2rem] border border-white/80 bg-white p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mb-5 flex items-center justify-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={18} fill="currentColor" />
                    ))}
                  </div>

                  <p className="text-base font-medium italic leading-8 text-gray-700 dark:text-gray-300">
                    “{item.quote}”
                  </p>

                  <div className="mt-8 flex flex-col items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-black ${item.accent}`}
                    >
                      {item.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-950 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {item.role}, {item.org}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-[2.75rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 px-8 py-14 text-center shadow-[0_30px_80px_rgba(59,130,246,0.25)] sm:px-10 lg:px-16 lg:py-20">
              <div className="mx-auto max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-blue-100">
                  Ready when you are
                </p>
                <h2 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Bring your entire school into one connected workspace.
                </h2>
                <p className="mt-6 text-base font-medium leading-8 text-blue-100 sm:text-lg">
                  Set up your school, onboard your staff, and simplify academic
                  operations with a platform designed for modern education.
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-black text-blue-900 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    Get Started as an Admin
                    <ArrowRight size={18} />
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-base font-bold text-white transition hover:bg-white/15"
                  >
                    Log In
                  </Link>
                </div>

                <p className="mt-5 text-sm font-medium text-blue-100/90">
                  No credit card required. Built for real school workflows.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto border-t border-gray-200 bg-white/90 px-4 pb-8 pt-12 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 text-center md:grid-cols-4 md:text-left">
          <div className="md:col-span-1">
            <div className="flex items-center justify-center gap-2.5 md:justify-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-lg shadow-blue-500/20">
                E
              </div>
              <div className="leading-none">
                <span className="text-lg font-black tracking-tight text-blue-600 dark:text-blue-400">
                  Edu
                </span>
                <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                  Sync.
                </span>
              </div>
            </div>

            <p className="mt-4 mx-auto max-w-xs text-sm font-medium leading-7 text-gray-500 dark:text-gray-400 md:mx-0">
              The connected school management platform for academic operations,
              communication, and reporting.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3 md:justify-start">
              {[
                { icon: Twitter, label: "Twitter" },
                { icon: Linkedin, label: "LinkedIn" },
                { icon: Github, label: "GitHub" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href="#"
                    aria-label={item.label}
                    className="rounded-full border border-gray-200 p-2.5 text-gray-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-800 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-900 dark:hover:text-white"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.18em] text-gray-900 dark:text-white">
              Product
            </h4>
            <ul className="mt-5 space-y-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              <li>
                <a
                  href="#features"
                  className="transition hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Features
                </a>
              </li>
              <li>
                <Link
                  to="/register"
                  className="transition hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="transition hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Admin Login
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="transition hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Student Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.18em] text-gray-900 dark:text-white">
              Resources
            </h4>
            <ul className="mt-5 space-y-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              <li>
                <a
                  href="#how-it-works"
                  className="transition hover:text-blue-600 dark:hover:text-blue-400"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="transition hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Testimonials
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="transition hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="transition hover:text-blue-600 dark:hover:text-blue-400"
                >
                  API Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.18em] text-gray-900 dark:text-white">
              Why EduSync
            </h4>
            <ul className="mt-5 space-y-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              {trustItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start justify-center gap-2 md:justify-start"
                >
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-gray-200 pt-8 text-center text-sm font-medium text-gray-400 dark:border-gray-800 md:flex-row md:text-left">
          <p>© {new Date().getFullYear()} EduSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

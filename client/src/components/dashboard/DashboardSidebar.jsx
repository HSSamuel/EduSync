import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";

function NavSection({
  category,
  itemIds,
  navItems,
  expandedCategories,
  toggleCategory,
  activeTab,
  setActiveTab,
  isSidebarOpen,
  mobile = false,
  onNavigate,
}) {
  const categoryItems = navItems.filter((i) => itemIds.includes(i.id) && i.show);
  if (categoryItems.length === 0) return null;

  return (
    <div className="mb-2">
      {(isSidebarOpen || mobile) && (
        <button
          onClick={() => toggleCategory(category)}
          aria-expanded={expandedCategories[category]}
          aria-controls={`${mobile ? "mobile" : "desktop"}-category-${category}`}
          className="w-full flex items-center justify-between px-4 py-2 mb-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors outline-none group"
        >
          <h3 className="text-[10px] font-black uppercase tracking-widest group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            {category}
          </h3>
          <ChevronDown
            size={14}
            className={`transition-transform duration-300 ${expandedCategories[category] ? "rotate-180" : ""}`}
          />
        </button>
      )}

      <motion.div
        id={`${mobile ? "mobile" : "desktop"}-category-${category}`}
        initial={false}
        animate={{
          height: !isSidebarOpen || mobile || expandedCategories[category] ? "auto" : 0,
          opacity: !isSidebarOpen || mobile || expandedCategories[category] ? 1 : 0,
          marginTop: !isSidebarOpen || mobile || expandedCategories[category] ? 4 : 0,
        }}
        className="space-y-1 overflow-hidden"
      >
        {categoryItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={`${mobile ? "mobile" : "desktop"}-${item.id}`}
              onClick={() => {
                setActiveTab(item.id);
                onNavigate?.();
              }}
              title={!isSidebarOpen && !mobile ? item.label : ""}
              aria-current={isActive ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-4 ${mobile ? "py-3" : "py-2.5"} font-semibold text-sm transition-all rounded-2xl relative group ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
              } ${!isSidebarOpen && !mobile ? "justify-center px-0" : ""}`}
            >
              {isActive && (
                <motion.div
                  layoutId={mobile ? "mobile-active-indicator" : "desktop-active-indicator"}
                  className={`absolute left-0 ${mobile ? "top-2 bottom-2" : "top-1.5 bottom-1.5"} w-1 bg-blue-600 dark:bg-blue-500 rounded-r-full`}
                />
              )}

              <item.icon
                size={18}
                className={`shrink-0 ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                }`}
              />

              {(isSidebarOpen || mobile) && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}

export default function DashboardSidebar({
  navCategories,
  navItems,
  expandedCategories,
  toggleCategory,
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  return (
    <>
      <aside
        className={`hidden md:flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/70 dark:border-gray-800 transition-all duration-300 ease-in-out z-20 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200/70 dark:border-gray-800 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && "justify-center w-full"}`}>
            <div className="w-9 h-9 shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
              E
            </div>
            {isSidebarOpen && (
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white whitespace-nowrap">
                Edu<span className="text-blue-600">Sync.</span>
              </h1>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-4 [&::-webkit-scrollbar]:hidden" aria-label="Main Navigation">
          {Object.entries(navCategories).map(([category, itemIds]) => (
            <NavSection
              key={category}
              category={category}
              itemIds={itemIds}
              navItems={navItems}
              expandedCategories={expandedCategories}
              toggleCategory={toggleCategory}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isSidebarOpen={isSidebarOpen}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200/70 dark:border-gray-800 flex justify-center shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 shadow-2xl z-50 md:hidden flex flex-col border-r border-gray-200 dark:border-gray-800"
              aria-label="Mobile Navigation"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200/70 dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
                    E
                  </div>
                  <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                    Edu<span className="text-blue-600">Sync.</span>
                  </h1>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close mobile menu"
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-4">
                {Object.entries(navCategories).map(([category, itemIds]) => (
                  <NavSection
                    key={`mobile-${category}`}
                    category={category}
                    itemIds={itemIds}
                    navItems={navItems}
                    expandedCategories={expandedCategories}
                    toggleCategory={toggleCategory}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isSidebarOpen={true}
                    mobile
                    onNavigate={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

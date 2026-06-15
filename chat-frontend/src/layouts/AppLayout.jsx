import { useSelector, useDispatch } from 'react-redux';
import { selectTheme, selectSidebarOpen, setSidebarOpen } from '../features/ui/uiSlice';

/**
 * APPLICATION LAYOUT COMPONENT
 * 
 * Why this layout exists:
 * - Centralizes the master UI layout shell, encapsulating theme configuration (light/dark mode) and responsive viewports.
 * - Manages the split-screen relationship between the Sidebar and the Chat Panel.
 * 
 * Layout Mechanics:
 * - Theme Propagation: Reads the theme state from Redux and applies the corresponding CSS classes (`dark` vs `light`) at the wrapper root.
 * - Mobile Responsiveness: Uses a flex layout. On mobile screens (`sm` and below), if a chat is active and the sidebar is closed,
 *   the Sidebar is hidden off-screen, and the chat occupies the full viewport. The sidebar state is controlled via `uiSlice` in Redux.
 */
export const AppLayout = ({ sidebar, children }) => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const sidebarOpen = useSelector(selectSidebarOpen);

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} w-screen h-screen flex overflow-hidden select-none`}>
      {/* 
        Master wrapper with Tailwind CSS v4 variables:
        We define default background, text, and transition behaviors.
      */}
      <div className="flex w-full h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        
        {/* 
          SIDEBAR CONTAINER 
          Responsive behavior:
          - On mobile (default): slides/toggles width. Translates horizontally off-screen when closed.
          - On medium screens & above (md:): fixed width (w-80 or w-96) and always visible if desired.
        */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-30
            w-full sm:w-80 md:w-96 h-full
            flex flex-col
            bg-white dark:bg-slate-900 
            border-r border-slate-200 dark:border-slate-800
            transition-transform md:transition-none duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {sidebar}
        </aside>

        {/* 
          MOBILE OVERLAY BACKGROUND
          When sidebar is opened on mobile, click outside to close sidebar.
        */}
        {sidebarOpen && (
          <div
            onClick={() => dispatch(setSidebarOpen(false))}
            className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-xs md:hidden cursor-pointer"
          />
        )}

        {/* 
          MAIN CHAT SCREEN SLOT
          Occupies the remaining space. On mobile, if sidebar is open, this is hidden or compressed.
        */}
        <main className="flex-1 h-full flex flex-col relative min-w-0 overflow-hidden">
          {children}
        </main>
        
      </div>
    </div>
  );
};

export default AppLayout;

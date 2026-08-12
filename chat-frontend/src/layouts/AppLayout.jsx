import { useSelector, useDispatch } from 'react-redux';
import { selectTheme, selectSidebarOpen, setSidebarOpen } from '../features/ui/uiSlice';
import { selectSelectedChatUserId } from '../features/chat/chatSlice';

/**
 * Split-view from lg (1024px) up. Below that: full-screen list or full-screen chat.
 * 755×857 stays stacked so sidebar and chat are never squeezed together.
 */
export const AppLayout = ({ sidebar, children }) => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const sidebarOpen = useSelector(selectSidebarOpen);
  const selectedChatUserId = useSelector(selectSelectedChatUserId);
  const showMobileChat = Boolean(selectedChatUserId);

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} w-full h-full`}>
      <div className="flex w-full h-full bg-app-bg text-app-text overflow-hidden">
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            w-full lg:w-[22rem] xl:w-[24rem]
            h-full flex flex-col min-h-0
            bg-app-surface border-r border-app-border
            transition-transform lg:transition-none duration-300 ease-out
            ${showMobileChat && !sidebarOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
          `}
        >
          {sidebar}
        </aside>

        {sidebarOpen && showMobileChat && (
          <div
            onClick={() => dispatch(setSidebarOpen(false))}
            className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-[1px] lg:hidden cursor-pointer"
            aria-hidden="true"
          />
        )}

        <main
          className={`
            flex-1 h-full flex flex-col relative min-w-0 overflow-hidden
            ${showMobileChat ? 'flex' : 'hidden lg:flex'}
          `}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

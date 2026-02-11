
import React, { useState, useEffect, useRef } from 'react';
import { AppState, User, Post, ClubLocation, Comment, Theme, Idea, IdeaType, Specialization, UserStatus, Notification, Mood, BadgeDefinition, Story, HelpRequest } from './types';
import { INITIAL_USERS, INITIAL_LOCATIONS, INITIAL_POSTS, INITIAL_IDEAS, BADGE_DEFINITIONS, SOUNDS, INITIAL_STORIES, INITIAL_HELP_REQUESTS } from './constants';
import PostCard, { SpecIcon } from './components/PostCard';
import AdminDashboard from './components/AdminDashboard';
import IdeaCard from './components/IdeaCard';
import PersonalizedDashboard from './components/PersonalizedDashboard';
import CollaborativeCanvas from './components/CollaborativeCanvas';
import StoryViewer from './components/StoryViewer';
import IdentityReveal from './components/IdentityReveal';
import CinematicPreview from './components/CinematicPreview';
import VirtualStudioTour from './components/VirtualStudioTour';
import Badge from './components/Badge';
import CinematicEntrance from './components/CinematicEntrance';
import CreativeHub from './modules/creative-hub/CreativeHub';
import { NotificationToast, NotificationCenter } from './components/NotificationSystem';
import { moderateContent, suggestCaption } from './services/geminiService';
import { 
  Users, 
  LayoutGrid, 
  MapPin, 
  ShieldCheck, 
  LogOut, 
  UserCircle,
  Image as ImageIcon,
  X,
  Loader2, 
  Camera,
  Lock,
  User as UserIcon,
  Search,
  Plus,
  Sun,
  Moon,
  Lightbulb,
  ChevronDown,
  Sparkles,
  Map as MapIcon,
  CheckCircle2,
  Clock,
  SmilePlus,
  BarChart3,
  KeyRound,
  Aperture,
  Tv,
  Mic,
  Video,
  Clapperboard,
  Bell,
  Heart,
  MessageCircle,
  Shield,
  Volume2,
  VolumeX,
  Trash2,
  Check,
  MessageSquare,
  XCircle,
  Zap,
  Coffee,
  Target,
  Palette,
  Award,
  Megaphone,
  Gift,
  Activity,
  Focus,
  Disc,
  Grip,
  Menu,
  MoreHorizontal,
  Fingerprint,
  ArrowRight,
  Scan,
  Radio,
  Eye,
  EyeOff,
  Compass,
  Settings,
  Briefcase
} from 'lucide-react';

const COMMON_EMOJIS = ['😊', '😂', '🔥', '❤️', '👏', '🎬', '📸', '✨', '🎥', '🙌', '💡', '💯'];

// --- Cinematic Wrapper (Global - Defined OUTSIDE App) ---
const CinematicWrapper: React.FC<{ children: React.ReactNode, showHud?: boolean }> = ({ children, showHud = true }) => (
  <div className="min-h-screen relative overflow-hidden bg-[#030303] text-white selection:bg-indigo-500/30">
    <div className="film-grain"></div>
    
    {/* Studio Overlay UI (HUD) */}
    {showHud && (
      <div className="fixed inset-0 z-[60] pointer-events-none p-6 md:p-10 opacity-30 select-none">
         <div className="w-full h-full border border-white/5 rounded-[3rem] relative">
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-xl"></div>
            
            {/* Top Status Bar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[9px] font-mono tracking-widest text-white/60 bg-black/50 px-4 py-1 rounded-full border border-white/10 backdrop-blur-sm">
               <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>REC</span>
               <span>ISO 400</span>
               <span>4K 60FPS</span>
               <span className="text-emerald-400">BAT 87%</span>
            </div>
         </div>
      </div>
    )}
    <div className="relative z-10">{children}</div>
  </div>
);

// --- Cinematic Input Component ---
interface CinematicInputProps {
  id: string;
  type?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ElementType;
  isPassword?: boolean;
  dimmed?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: boolean;
}

const CinematicInput: React.FC<CinematicInputProps> = ({ 
  id, type = 'text', label, value, onChange, icon: Icon, isPassword = false, dimmed = false, onFocus, onBlur, error
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`relative group transition-all duration-500 ease-out ${dimmed ? 'opacity-30 scale-95 blur-[2px]' : 'opacity-100 scale-100 blur-0'}`}>
      
      {/* Hover Light Sweep Effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0">
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
      </div>

      {/* Main Container */}
      <div className={`
        relative bg-[#050505]/60 backdrop-blur-xl border rounded-2xl transition-all duration-300 overflow-hidden
        ${error 
           ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
           : isFocused 
             ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] bg-[#0a0a0a]/80' 
             : 'border-white/10 hover:border-white/20 hover:bg-[#0a0a0a]/60 shadow-inner'
        }
      `}>
        
        {/* Floating Label */}
        <label 
          htmlFor={id}
          className={`absolute left-4 transition-all duration-300 pointer-events-none z-10 font-black uppercase tracking-widest
            ${isFocused || value 
              ? 'top-2.5 text-[8px] text-indigo-400 translate-y-0' 
              : 'top-1/2 -translate-y-1/2 text-[10px] text-white/30'
            }
          `}
        >
          {label}
        </label>

        {/* Input Field */}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            w-full bg-transparent text-white text-sm font-bold px-4 pt-6 pb-2.5 outline-none placeholder-transparent relative z-10 transition-opacity
            ${!(isFocused || value) ? 'opacity-0' : 'opacity-100'} 
          `}
          autoComplete="off"
        />
        
        {/* Right Side Icons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 z-20">
           {/* Success Indicator */}
           <div className={`text-emerald-500 transition-all duration-500 transform ${value.length > 2 && !error ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
              <CheckCircle2 size={14} />
           </div>

           {/* Password Toggle */}
           {isPassword && (
             <button
               type="button"
               onClick={() => setShowPassword(!showPassword)}
               className="text-white/30 hover:text-white transition-colors focus:outline-none p-1 rounded-md active:scale-95"
               tabIndex={-1}
             >
               {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
             </button>
           )}

           {/* Static Icon */}
           {Icon && !isPassword && (
              <div className={`transition-colors duration-300 ${isFocused ? 'text-white' : 'text-white/30'}`}>
                 <Icon size={16} />
              </div>
           )}
        </div>

        {/* Animated Bottom Border */}
        <div className={`absolute bottom-0 left-0 h-[1px] bg-indigo-500 shadow-[0_0_10px_#6366f1] transition-all duration-500 ease-out ${isFocused ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('mediaClubState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.users = parsed.users.map((u: any) => ({ 
          ...u, 
          status: u.status || 'ACTIVE', 
          specialization: u.specialization || 'عام',
          badges: u.badges || [],
          reputationPoints: u.reputationPoints || 0,
          isAvailableForHelp: u.isAvailableForHelp ?? false,
          skills: u.skills || []
        }));
        parsed.ideas = parsed.ideas || INITIAL_IDEAS;
        parsed.locations = parsed.locations || INITIAL_LOCATIONS;
        parsed.stories = parsed.stories || INITIAL_STORIES;
        parsed.notifications = parsed.notifications || [];
        parsed.helpRequests = parsed.helpRequests || INITIAL_HELP_REQUESTS;
        parsed.settings = parsed.settings || { cinematicEntrance: true };
        return parsed;
      } catch (e) {
        console.error("State Recovery Failed:", e);
      }
    }
    return {
      users: INITIAL_USERS.map(u => ({ ...u, status: 'ACTIVE' })),
      posts: INITIAL_POSTS,
      ideas: INITIAL_IDEAS,
      locations: INITIAL_LOCATIONS,
      stories: INITIAL_STORIES,
      notifications: [],
      portfolioItems: [],
      socialLinks: [],
      helpRequests: INITIAL_HELP_REQUESTS,
      currentUser: null,
      theme: 'dark',
      settings: {
        cinematicEntrance: true
      }
    };
  });

  const [view, setView] = useState<'FEED' | 'MEMBERS' | 'LOCATIONS' | 'PROFILE' | 'ADMIN' | 'IDEAS' | 'CANVAS' | 'TOUR' | 'CREATIVE_HUB'>('FEED');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [newPostForm, setNewPostForm] = useState({ content: '', mediaType: 'image' as 'image' | 'video', mediaData: '' });
  const [newIdeaForm, setNewIdeaForm] = useState({ title: '', description: '', type: 'تقرير' as IdeaType, showModal: false });
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mood, setMood] = useState<Mood>('ENERGY');
  const [viewingStoryId, setViewingStoryId] = useState<string | null>(null);
  
  // Notification System State
  const [showNotifications, setShowNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);
  const [unlockedBadge, setUnlockedBadge] = useState<BadgeDefinition | null>(null);
  
  // Login Experience State
  const [loginLoading, setLoginLoading] = useState(false);
  // Added 'REVEAL' and 'COMPLETED' phases
  const [loginPhase, setLoginPhase] = useState<'INTRO' | 'FORM' | 'AUTHENTICATING' | 'SUCCESS' | 'REVEAL' | 'COMPLETED'>('INTRO');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Preview Mode State
  const [showPreview, setShowPreview] = useState(false);

  // Ref for Parallax Container
  const containerRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);

  // --- Cinematic Mouse Parallax (Optimized) ---
  useEffect(() => {
    if (state.currentUser && loginPhase === 'COMPLETED' && view !== 'TOUR') return; // Only needed for login & reveal

    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      // Use requestAnimationFrame for smooth updates without React renders
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (containerRef.current) {
          const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
          const y = (e.clientY / innerHeight - 0.5) * 2;
          // Direct DOM manipulation for performance
          containerRef.current.style.setProperty('--mouse-x', x.toString());
          containerRef.current.style.setProperty('--mouse-y', y.toString());
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [state.currentUser, loginPhase, view]);

  // --- Cinematic Intro Timer ---
  useEffect(() => {
    if (!state.currentUser && loginPhase === 'INTRO') {
      const timer = setTimeout(() => {
        setLoginPhase('FORM');
      }, 2500); // 2.5s intro
      return () => clearTimeout(timer);
    }
  }, [state.currentUser, loginPhase]);

  // --- Dynamic Mood Logic ---
  useEffect(() => {
    // Mood now affects subtle lighting gradients rather than drastic theme changes
    const calculateMood = (): Mood => {
      if (view === 'ADMIN' || view === 'IDEAS') return 'FOCUS';
      const unreadCount = state.notifications.filter(n => !n.read).length;
      if (unreadCount > 2) return 'ENERGY';
      const hour = new Date().getHours();
      if (hour >= 20 || hour < 6) return 'CALM';
      return 'ENERGY';
    };
    setMood(calculateMood());
  }, [view, state.notifications]);

  // --- Notification Logic ---
  const playNotificationSound = (soundKey: string = 'default') => {
    if (soundEnabled) {
      try {
        const soundData = SOUNDS[soundKey as keyof typeof SOUNDS] || SOUNDS['default'];
        const audio = new Audio(soundData); 
        audio.play().catch(() => {}); 
      } catch (e) {}
    }
  };

  const addNotification = (type: Notification['type'], content: string, sender: User, recipientId: string = 'ALL', relatedId?: string, sound: string = 'default') => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      recipientId,
      senderId: sender.id,
      senderName: sender.fullName,
      senderAvatar: sender.avatar,
      type,
      content,
      relatedId,
      timestamp: Date.now(),
      read: false,
      sound
    };

    setState(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications]
    }));

    if (recipientId === 'ALL' || recipientId === state.currentUser?.id) {
       playNotificationSound(sound);
       // Add to active toasts for top display
       setActiveToasts(prev => [newNotif, ...prev]);
    }
  };

  // --- Badge Logic ---
  const checkAndAwardBadge = (userId: string, badgeId: string) => {
    setState(prev => {
       const user = prev.users.find(u => u.id === userId);
       if (!user || user.badges.some(b => b.id === badgeId)) return prev;

       const newBadge = { id: badgeId, timestamp: Date.now() };
       const updatedUser = { ...user, badges: [...user.badges, newBadge] };
       
       if (prev.currentUser?.id === userId) {
          setUnlockedBadge(BADGE_DEFINITIONS[badgeId]);
          playNotificationSound('success');
       }

       const notifId = Math.random().toString(36).substr(2, 9);
       const badgeNotif: Notification = {
         id: notifId,
         recipientId: userId,
         senderId: 'SYSTEM',
         senderName: 'نادي الإعلام',
         senderAvatar: 'https://cdn-icons-png.flaticon.com/512/5402/5402751.png', 
         type: 'BADGE',
         content: `مبروك! حصلت على وسام "${BADGE_DEFINITIONS[badgeId].name}" 🎉`,
         timestamp: Date.now(),
         read: false,
         sound: 'success'
       };

       // Also trigger visual toast for badge
       setActiveToasts(prevToasts => [badgeNotif, ...prevToasts]);

       return {
         ...prev,
         users: prev.users.map(u => u.id === userId ? updatedUser : u),
         currentUser: prev.currentUser?.id === userId ? updatedUser : prev.currentUser,
         notifications: [badgeNotif, ...prev.notifications]
       };
    });
  };

  const clearNotifications = () => {
    setState(prev => ({ ...prev, notifications: [] }));
  };

  const markAsRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  const handleSendNotification = (recipientId: string, type: Notification['type'], content: string, sound: string) => {
    if (!state.currentUser) return;
    addNotification(type, content, state.currentUser, recipientId, undefined, sound);
  };

  // --- Story Logic ---
  const handleUploadStory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && state.currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newStory: Story = {
          id: Math.random().toString(36).substr(2, 9),
          authorId: state.currentUser!.id,
          mediaUrl: reader.result as string,
          mediaType: file.type.startsWith('video') ? 'video' : 'image',
          timestamp: Date.now(),
          viewers: 0,
          likes: 0,
          comments: []
        };
        setState(prev => ({ ...prev, stories: [newStory, ...prev.stories] }));
        addNotification('ACTIVITY', 'قام بنشر قصة جديدة 📸', state.currentUser!, 'ALL', newStory.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStoryInteraction = (storyId: string, type: 'LIKE' | 'COMMENT', payload?: string) => {
    if (!state.currentUser) return;
    setState(prev => {
      return {
        ...prev,
        stories: prev.stories.map(s => {
          if (s.id !== storyId) return s;
          if (type === 'LIKE') return { ...s, likes: s.likes + 1 };
          if (type === 'COMMENT' && payload) {
            const newComment: Comment = {
              id: Math.random().toString(36),
              authorId: state.currentUser!.id,
              authorName: state.currentUser!.fullName,
              content: payload,
              timestamp: Date.now()
            };
            return { ...s, comments: [...s.comments, newComment] };
          }
          return s;
        })
      }
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem('mediaClubState', JSON.stringify(state));
    } catch (e) {}
  }, [state]);

  // --- Login Logic ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginPhase('AUTHENTICATING');
    
    // Simulate shutter/focus delay
    setTimeout(() => {
      const user = state.users.find(u => u.username.toLowerCase() === loginForm.username.toLowerCase() && u.password === loginForm.password);
      if (user) {
        if (user.status === 'BLOCKED') {
          alert('⚠️ هذا الحساب محظور حالياً.');
          setLoginLoading(false);
          setLoginPhase('FORM');
          return;
        }
        playNotificationSound('success'); // Shutter sound
        setLoginPhase('SUCCESS'); // Shutter Closes
        
        // Final transition delay
        setTimeout(() => {
            setState(prev => ({ 
            ...prev, 
            currentUser: { ...user, isOnline: true },
            users: prev.users.map(u => u.id === user.id ? { ...u, isOnline: true, lastActive: Date.now() } : u)
            }));
            setLoginLoading(false);
            setLoginPhase('REVEAL'); // Trigger Identity Reveal
        }, 800);
      } else {
        // Error Shake
        const formEl = document.getElementById('login-form-container');
        if(formEl) {
            formEl.classList.add('animate-shake');
            setTimeout(() => formEl.classList.remove('animate-shake'), 500);
        }
        setLoginLoading(false);
        setLoginPhase('FORM');
      }
    }, 1200);
  };

  const handleLogout = () => {
    setState(prev => ({ 
      ...prev, 
      currentUser: null,
      users: prev.users.map(u => u.id === prev.currentUser?.id ? { ...u, isOnline: false } : u)
    }));
    setView('FEED');
    setLoginPhase('INTRO');
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    if (updates.role && state.currentUser?.role !== 'ADMIN') return;
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u),
      currentUser: prev.currentUser?.id === userId ? { ...prev.currentUser, ...updates } : prev.currentUser
    }));
  };

  const handleCreateUser = (newUser: User) => {
    if (state.currentUser?.role !== 'ADMIN') return;
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
  };

  const handleCreatePost = async () => {
    if (!state.currentUser) return;
    if (!newPostForm.content.trim() && !newPostForm.mediaData) {
       addNotification('MESSAGE', '⚠️ يجب كتابة نص أو إضافة صورة/فيديو للنشر', state.currentUser, state.currentUser.id, undefined, 'alert');
       return;
    }
    
    setIsUploading(true);
    try {
      let finalContent = newPostForm.content;
      if (finalContent.trim()) {
        const isSafe = await moderateContent(finalContent);
        if (!isSafe) { 
           addNotification('ADMIN', '🚫 تم حظر المنشور: المحتوى غير لائق.', state.currentUser, state.currentUser.id, undefined, 'alert');
           setIsUploading(false); 
           return; 
        }
      }
      if (!finalContent.trim() && newPostForm.mediaData) {
         finalContent = "مشاركة جديدة 📸";
      }
      const newPost: Post = {
        id: Math.random().toString(36).substr(2, 9),
        authorId: state.currentUser.id,
        authorName: state.currentUser.fullName,
        content: finalContent,
        mediaType: newPostForm.mediaType,
        mediaUrl: newPostForm.mediaData,
        timestamp: Date.now(),
        likes: [],
        reactions: {},
        comments: [],
        status: state.currentUser.role === 'ADMIN' ? 'APPROVED' : 'PENDING'
      };
      setState(prev => ({ ...prev, posts: [newPost, ...prev.posts] }));
      setNewPostForm({ content: '', mediaType: 'image', mediaData: '' });
      setShowPreview(false); // Close preview if open
      
      const userPostCount = state.posts.filter(p => p.authorId === state.currentUser!.id).length;
      if (userPostCount === 0) checkAndAwardBadge(state.currentUser.id, 'FIRST_POST');
      if (userPostCount === 2) checkAndAwardBadge(state.currentUser.id, 'ACTIVE_WRITER');
      if (newPostForm.mediaType === 'image') checkAndAwardBadge(state.currentUser.id, 'PHOTOGRAPHER');

      if (state.currentUser.role !== 'ADMIN') {
        const admins = state.users.filter(u => u.role === 'ADMIN');
        admins.forEach(admin => {
           addNotification('ADMIN', `📝 منشور جديد للمراجعة من ${state.currentUser?.fullName}`, state.currentUser!, admin.id, newPost.id);
        });
        addNotification('ACTIVITY', 'تم إرسال المنشور للمراجعة بنجاح ⏳', state.currentUser, state.currentUser.id, newPost.id, 'success');
      } else {
        addNotification('ACTIVITY', 'تم النشر بنجاح ✅', state.currentUser, state.currentUser.id, newPost.id, 'success');
      }

    } catch (error) {
      console.error("Post Creation Failed:", error);
      addNotification('ADMIN', '❌ حدث خطأ غير متوقع أثناء النشر.', state.currentUser, state.currentUser.id, undefined, 'alert');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateIdea = () => {
    if (!state.currentUser || !newIdeaForm.title.trim()) return;
    const newIdea: Idea = {
      id: Math.random().toString(36).substr(2, 9),
      title: newIdeaForm.title.trim(),
      description: newIdeaForm.description.trim(),
      type: newIdeaForm.type,
      authorId: state.currentUser.id,
      authorName: state.currentUser.fullName,
      timestamp: Date.now(),
      votes: [],
      status: 'قيد المراجعة'
    };
    setState(prev => ({ ...prev, ideas: [newIdea, ...prev.ideas] }));
    setNewIdeaForm({ title: '', description: '', type: 'تقرير', showModal: false });
    checkAndAwardBadge(state.currentUser.id, 'IDEA_MAKER');
    const admins = state.users.filter(u => u.role === 'ADMIN');
    admins.forEach(admin => {
       addNotification('ADMIN', `فكرة جديدة مقترحة: ${newIdea.title}`, state.currentUser!, admin.id, newIdea.id);
    });
    alert('✅ تم تسجيل الفكرة');
  };

  const handlePostAction = (postId: string, action: 'APPROVE' | 'DELETE') => {
    if (state.currentUser?.role !== 'ADMIN') return;
    if (action === 'APPROVE') {
        const post = state.posts.find(p => p.id === postId);
        if (post) {
            const author = state.users.find(u => u.id === post.authorId);
            if (author) addNotification('ADMIN', 'تمت الموافقة على منشورك ونشره بنجاح 🎉', state.currentUser!, author.id, postId);
        }
    }
    setState(prev => ({
      ...prev,
      posts: action === 'APPROVE' ? prev.posts.map(p => p.id === postId ? { ...p, status: 'APPROVED' } : p) : prev.posts.filter(p => p.id !== postId)
    }));
  };

  const handleUpdateIdea = (ideaId: string, updates: Partial<Idea>) => {
    if (state.currentUser?.role !== 'ADMIN') return;
    setState(prev => ({ ...prev, ideas: prev.ideas.map(i => i.id === ideaId ? { ...i, ...updates } : i) }));
  };

  const handleUpdateLocation = (locId: string, updates: Partial<ClubLocation>) => {
    if (state.currentUser?.role !== 'ADMIN') return;
    setState(prev => ({ ...prev, locations: prev.locations.map(l => l.id === locId ? { ...l, ...updates } : l) }));
  };

  const handleAddLocation = (name: string, description: string, image: string) => {
    if (state.currentUser?.role !== 'ADMIN') return;
    const newLoc: ClubLocation = { id: Math.random().toString(36).substr(2, 9), name, description, status: 'PLANNED', image: image || 'https://picsum.photos/seed/newloc/400/300' };
    setState(prev => ({ ...prev, locations: [newLoc, ...prev.locations] }));
  };

  const handleDeleteLocation = (locId: string) => {
    if (state.currentUser?.role !== 'ADMIN') return;
    if (window.confirm('هل تريد حذف هذه الوجهة نهائياً؟')) {
      setState(prev => ({ ...prev, locations: prev.locations.filter(l => l.id !== locId) }));
    }
  };

  const handleLike = (postId: string) => {
     if (!state.currentUser) return;
     const post = state.posts.find(p => p.id === postId);
     if (!post) return;

     const isLiking = !post.likes.includes(state.currentUser.id);
     setState(prev => ({
         ...prev,
         posts: prev.posts.map(p => p.id === postId ? { ...p, likes: isLiking ? [...p.likes, state.currentUser!.id] : p.likes.filter(uid => uid !== state.currentUser!.id) } : p)
     }));

     if (isLiking) {
         if (post.authorId !== state.currentUser.id) {
             const author = state.users.find(u => u.id === post.authorId);
             if (author) {
                 addNotification('LIKE', `أعجب ${state.currentUser.fullName} بمنشورك`, author, post.authorId, post.id);
                 const authorPosts = state.posts.filter(p => p.authorId === author.id);
                 const totalLikes = authorPosts.reduce((acc, curr) => acc + curr.likes.length, 0) + 1;
                 if (totalLikes >= 5) checkAndAwardBadge(author.id, 'INFLUENCER');
             }
         }
     }
  };

  const handleAddHelpRequest = (req: HelpRequest) => {
    setState(prev => ({
      ...prev,
      helpRequests: [req, ...prev.helpRequests]
    }));
  };

  const handleUpdateHelpRequest = (id: string, updates: Partial<HelpRequest>) => {
    setState(prev => ({
      ...prev,
      helpRequests: prev.helpRequests.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const toggleCinematicSetting = () => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, cinematicEntrance: !prev.settings.cinematicEntrance }
    }));
  };

  const topIdeaId = state.ideas.length > 0 ? [...state.ideas].sort((a, b) => b.votes.length - a.votes.length)[0].id : null;

  const unreadCount = state.notifications.filter(n => !n.read && (n.recipientId === 'ALL' || n.recipientId === state.currentUser?.id)).length;
  const latestAnnouncement = state.notifications.find(n => !n.read && n.type === 'ANNOUNCEMENT' && (n.recipientId === 'ALL' || n.recipientId === state.currentUser?.id));

  // Determine what to render based on login status
  const isLoggedIn = !!state.currentUser;

  return (
    <CinematicWrapper showHud={isLoggedIn}>
      
      {/* Identity Reveal Overlay */}
      {isLoggedIn && loginPhase === 'REVEAL' && (
        <IdentityReveal user={state.currentUser!} onEnter={() => setLoginPhase('COMPLETED')} />
      )}

      {/* Cinematic Preview Overlay */}
      {isLoggedIn && showPreview && state.currentUser && (
        <CinematicPreview 
          draftContent={newPostForm} 
          currentUser={state.currentUser} 
          onClose={() => setShowPreview(false)}
          onPublish={handleCreatePost}
        />
      )}

      {/* Virtual Studio Tour Overlay */}
      {isLoggedIn && view === 'TOUR' && (
        <VirtualStudioTour onClose={() => setView('FEED')} />
      )}

      {/* Main Content Area */}
      {isLoggedIn ? (
        <div className={`transition-all duration-1000 ${loginPhase === 'REVEAL' || showPreview ? 'blur-sm scale-[0.98] opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
          {/* Story Viewer Logic */}
          {(() => {
             const viewedStory = viewingStoryId ? state.stories.find(s => s.id === viewingStoryId) : null;
             const viewedStoryAuthor = viewedStory ? state.users.find(u => u.id === viewedStory.authorId) : null;
             if (viewingStoryId && viewedStory && viewedStoryAuthor) {
                return (
                  <StoryViewer 
                    story={viewedStory}
                    author={viewedStoryAuthor}
                    currentUser={state.currentUser!}
                    onClose={() => setViewingStoryId(null)}
                    onNext={() => {
                      const idx = state.stories.findIndex(s => s.id === viewingStoryId);
                      if (idx !== -1 && idx < state.stories.length - 1) setViewingStoryId(state.stories[idx + 1].id);
                      else setViewingStoryId(null);
                    }}
                    onPrev={() => {
                      const idx = state.stories.findIndex(s => s.id === viewingStoryId);
                      if (idx > 0) setViewingStoryId(state.stories[idx - 1].id);
                    }}
                    onLike={(id) => handleStoryInteraction(id, 'LIKE')}
                    onComment={(id, text) => handleStoryInteraction(id, 'COMMENT', text)}
                  />
                );
             }
             return null;
          })()}

          {/* Badge Overlay */}
          {unlockedBadge && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setUnlockedBadge(null)}>
              <div className="text-center" onClick={e => e.stopPropagation()}>
                  <div className="scale-[2] mb-12 drop-shadow-[0_0_50px_rgba(255,215,0,0.5)]">
                    <Badge {...unlockedBadge} size="xl" />
                  </div>
                  <h2 className="text-4xl font-black text-white mb-2">إنجاز جديد!</h2>
                  <p className="text-white/60 font-bold max-w-xs mx-auto mb-10">{unlockedBadge.name}</p>
                  <button onClick={() => setUnlockedBadge(null)} className="btn-camera px-10 py-3 rounded-full text-xs">استمرار</button>
              </div>
            </div>
          )}

          {/* NEW: Top Notification System (Toasts) */}
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 w-full max-w-md pointer-events-none items-center px-4">
            <div className="pointer-events-auto w-full flex flex-col items-center">
              {activeToasts.map(toast => (
                <NotificationToast 
                  key={toast.id} 
                  notification={toast} 
                  onDismiss={(id) => setActiveToasts(prev => prev.filter(t => t.id !== id))}
                  onClick={() => setView('FEED')} 
                />
              ))}
            </div>
          </div>

          {/* NEW: Notification Center Dropdown */}
          <div className="relative z-[65]">
             <NotificationCenter 
               isOpen={showNotifications} 
               onClose={() => setShowNotifications(false)}
               notifications={state.notifications}
               onMarkRead={markAsRead}
               onClearAll={clearNotifications}
               onNavigate={(v) => { setView(v); setShowNotifications(false); }}
             />
          </div>

          {/* App Layout */}
          <div className="flex flex-col lg:flex-row min-h-screen">
            
            {/* Floating Toolbar (Desktop) */}
            <aside className="hidden lg:flex w-24 flex-col items-center fixed inset-y-0 right-0 z-50 py-8">
              <div className="glass-panel w-16 flex-1 rounded-[2rem] flex flex-col items-center py-6 gap-6 shadow-2xl backdrop-blur-2xl bg-black/40 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4"><Camera size={20} className="text-white" /></div>
                <nav className="flex-1 flex flex-col gap-4 w-full px-2">
                  {[ 
                    { id: 'FEED', icon: LayoutGrid, label: 'Feed' }, 
                    { id: 'CREATIVE_HUB', icon: Briefcase, label: 'Creative Hub' },
                    { id: 'IDEAS', icon: Lightbulb, label: 'Ideas' }, 
                    { id: 'MEMBERS', icon: Users, label: 'Crew' }, 
                    { id: 'LOCATIONS', icon: MapPin, label: 'Sets' }, 
                    { id: 'CANVAS', icon: Palette, label: 'Art' }, 
                    { id: 'TOUR', icon: Compass, label: 'Tour' }, 
                    { id: 'ADMIN', icon: ShieldCheck, label: 'Admin', adminOnly: true }, 
                    { id: 'PROFILE', icon: UserCircle, label: 'Me' } 
                  ].map(item => {
                    if (item.adminOnly && state.currentUser?.role !== 'ADMIN') return null;
                    return (
                      <button key={item.id} onClick={() => setView(item.id as any)} className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all group relative ${view === item.id ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>
                        <item.icon size={20} />
                        <span className="absolute right-full mr-4 bg-black/80 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border border-white/10 backdrop-blur-md translate-x-2 group-hover:translate-x-0">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
                <button onClick={handleLogout} className="text-rose-500 hover:bg-rose-500/20 p-3 rounded-xl transition hover:shadow-[0_0_20px_rgba(225,29,72,0.3)]"><LogOut size={20}/></button>
              </div>
            </aside>

            {/* Mobile Header & Nav */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 p-4">
              <div className="glass-panel rounded-2xl p-4 flex justify-between items-center bg-black/60 backdrop-blur-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Camera size={16} className="text-white"/></div>
                    <span className="font-black text-sm tracking-widest">MEDIA CLUB</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-lg"><Menu className="text-white"/></button>
              </div>
              {mobileMenuOpen && (
                  <div className="glass-panel mt-2 rounded-2xl p-2 absolute left-4 right-4 flex flex-col gap-1 animate-in slide-in-from-top-2 bg-black/90 backdrop-blur-xl border border-white/10">
                    {[ 
                        { id: 'FEED', icon: LayoutGrid, label: 'Feed' }, 
                        { id: 'CREATIVE_HUB', icon: Briefcase, label: 'Creative Hub' },
                        { id: 'IDEAS', icon: Lightbulb, label: 'Ideas' }, 
                        { id: 'MEMBERS', icon: Users, label: 'Crew' }, 
                        { id: 'LOCATIONS', icon: MapPin, label: 'Sets' }, 
                        { id: 'TOUR', icon: Compass, label: 'Studio Tour' }, 
                        { id: 'PROFILE', icon: UserCircle, label: 'Profile' } 
                    ].map(item => (
                        <button key={item.id} onClick={() => { setView(item.id as any); setMobileMenuOpen(false); }} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 text-white font-bold text-sm">
                          <item.icon size={18}/> {item.label}
                        </button>
                    ))}
                    <button onClick={handleLogout} className="flex items-center gap-4 p-3 rounded-xl hover:bg-rose-500/20 text-rose-400 font-bold text-sm"><LogOut size={18}/> Logout</button>
                  </div>
              )}
            </div>

            <main className="flex-1 lg:mr-24 p-6 lg:p-10 pt-24 lg:pt-10 overflow-x-hidden relative z-10">
              
              {/* Top Bar (Desktop) - HUD Style */}
              <header className="hidden lg:flex justify-between items-center mb-10">
                <div className="flex items-center gap-6">
                    <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-mono text-white/60 uppercase tracking-widest border border-white/5">
                      <Focus size={14} className="text-indigo-400"/>
                      <span>MODE: <span className="text-white font-bold">{view}</span></span>
                    </div>
                    <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-mono text-white/60 uppercase tracking-widest border border-white/5">
                      <Activity size={14} className="text-emerald-400"/>
                      <span>STATUS: LIVE</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative">
                    <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black text-white border border-white/5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      ONLINE: {state.users.filter(u => u.isOnline).length}
                    </div>
                    
                    {/* Trigger for Notification Center */}
                    <div className="relative">
                      <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-3 rounded-full hover:bg-white/10 transition group">
                        <Bell size={20} className="text-white group-hover:scale-110 transition"/>
                        {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.5)]"></span>}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 cursor-pointer group glass-panel pl-4 pr-1 py-1 rounded-full hover:bg-white/5 transition border border-transparent hover:border-white/10" onClick={() => setView('PROFILE')}>
                      <div className="text-right">
                          <p className="text-xs font-black text-white group-hover:text-indigo-400 transition">{state.currentUser!.fullName}</p>
                          <p className="text-[9px] text-white/40 font-mono tracking-wider uppercase">{state.currentUser!.specialization}</p>
                      </div>
                      <img src={state.currentUser!.avatar} className="w-9 h-9 rounded-full object-cover border border-white/20 group-hover:border-indigo-500 transition" loading="lazy" />
                    </div>
                </div>
              </header>

              {/* Announcement Banner - Cinematic Style */}
              {latestAnnouncement && (
                <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 p-1 flex items-center justify-between reveal-cinematic group">
                  <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition"></div>
                  <div className="flex items-center justify-between w-full p-6 relative z-10">
                      <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]"><Megaphone size={24}/></div>
                          <div>
                            <span className="text-[9px] font-black bg-blue-500/20 text-blue-300 px-2 py-1 rounded uppercase tracking-[0.2em] border border-blue-500/20">System Broadcast</span>
                            <p className="text-lg font-bold text-white mt-1 text-glow">{latestAnnouncement.content}</p>
                          </div>
                      </div>
                      <button onClick={() => markAsRead(latestAnnouncement.id)} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition hover:text-blue-400">DISMISS</button>
                  </div>
                </div>
              )}

              <CinematicEntrance active={state.settings.cinematicEntrance} viewKey={view}>
                <div className="max-w-6xl mx-auto">
                  {view === 'FEED' && (
                    <div className="space-y-12">
                      <PersonalizedDashboard user={state.currentUser!} posts={state.posts} ideas={state.ideas} notifications={state.notifications} onNavigate={setView} />
                      
                      {/* Stories Tray */}
                      <div className="relative">
                        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/10 -z-10"></div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2"><Disc size={14} className="animate-spin-slow"/> Recent Stories</h3>
                        </div>
                        <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar px-2">
                            <div className="shrink-0 w-24 flex flex-col gap-3 items-center cursor-pointer group" onClick={() => storyInputRef.current?.click()}>
                              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center hover:border-white hover:bg-white/5 transition group-hover:scale-105">
                                  <Plus size={24} className="text-white/50 group-hover:text-white transition"/>
                              </div>
                              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest group-hover:text-white">Add Reel</span>
                              <input type="file" ref={storyInputRef} className="hidden" accept="image/*,video/*" onChange={handleUploadStory} />
                            </div>
                            {state.stories.map(story => {
                              const author = state.users.find(u => u.id === story.authorId);
                              if(!author) return null;
                              return (
                                  <div key={story.id} className="shrink-0 w-24 flex flex-col gap-3 items-center cursor-pointer group" onClick={() => setViewingStoryId(story.id)}>
                                    <div className="w-20 h-20 rounded-2xl p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition duration-500 relative">
                                        <div className="absolute inset-0 bg-black rounded-2xl m-[2px]"></div>
                                        <img src={author.avatar} className="w-full h-full rounded-2xl object-cover relative z-10 group-hover:scale-95 transition" loading="lazy" />
                                        <div className="absolute -bottom-2 -right-2 bg-black border border-white/20 p-1 rounded-full z-20"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-white truncate w-full text-center uppercase tracking-wider group-hover:text-indigo-400 transition">{author.username}</span>
                                  </div>
                              )
                            })}
                        </div>
                      </div>

                      {/* Create Post */}
                      <div className="glass-panel p-1 rounded-3xl relative overflow-hidden group hover:border-white/20 transition-colors">
                        <div className="bg-black/40 rounded-[1.3rem] p-6 relative">
                            <div className="flex gap-6">
                                <img src={state.currentUser!.avatar} className="w-14 h-14 rounded-2xl object-cover border border-white/10" loading="lazy" />
                                <div className="flex-1">
                                  <textarea 
                                      placeholder={`What's in the frame, ${state.currentUser!.fullName.split(' ')[0]}?`}
                                      className="w-full bg-transparent border-none text-lg font-medium text-white placeholder-white/20 focus:ring-0 resize-none h-24 font-mono leading-relaxed"
                                      value={newPostForm.content}
                                      onChange={e => setNewPostForm(prev => ({...prev, content: e.target.value}))}
                                  />
                                  
                                  {newPostForm.mediaData && (
                                      <div className="relative mt-4 rounded-xl overflow-hidden h-64 w-fit border border-white/10 shadow-2xl group/media">
                                        <button onClick={() => setNewPostForm(p => ({...p, mediaData: ''}))} className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white p-1.5 rounded-lg hover:bg-rose-500 transition"><X size={14}/></button>
                                        {newPostForm.mediaType === 'image' ? <img src={newPostForm.mediaData} className="h-full w-auto object-cover"/> : <video src={newPostForm.mediaData} className="h-full w-auto" controls/>}
                                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur rounded text-[9px] font-mono text-white/70 uppercase tracking-widest border border-white/10">RAW Preview</div>
                                      </div>
                                  )}

                                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5">
                                      <div className="flex gap-2">
                                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-indigo-400 transition text-xs font-bold uppercase tracking-wider border border-white/5"><ImageIcon size={14}/> Media</button>
                                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-amber-400 transition text-xs font-bold uppercase tracking-wider border border-white/5 relative">
                                            <SmilePlus size={14}/> Mood
                                            {showEmojiPicker && (
                                              <div className="absolute top-full left-0 mt-2 glass-panel p-2 grid grid-cols-6 gap-1 z-50 w-64">
                                                  {COMMON_EMOJIS.map(e => <button key={e} onClick={() => {setNewPostForm(p => ({...p, content: p.content + e})); setShowEmojiPicker(false);}} className="text-xl hover:bg-white/10 p-2 rounded transition hover:scale-125">{e}</button>)}
                                              </div>
                                            )}
                                        </button>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={e => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onload = () => setNewPostForm(p => ({...p, mediaData: r.result as string, mediaType: f.type.startsWith('video') ? 'video' : 'image'})); r.readAsDataURL(f); } }} />
                                      </div>
                                      <div className="flex gap-2">
                                        <button 
                                            disabled={!newPostForm.content.trim() && !newPostForm.mediaData}
                                            onClick={() => setShowPreview(true)}
                                            className="px-6 py-2.5 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-lg hover:bg-white/20 transition disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                        >
                                            <Eye size={12} /> PREVIEW
                                        </button>
                                        <button disabled={isUploading || (!newPostForm.content.trim() && !newPostForm.mediaData)} onClick={handleCreatePost} className="px-8 py-2.5 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-lg hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition disabled:opacity-50 disabled:scale-100 flex items-center gap-2">
                                            {isUploading ? <Loader2 size={12} className="animate-spin"/> : <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>}
                                            {isUploading ? 'PROCESSING' : 'BROADCAST'}
                                        </button>
                                      </div>
                                  </div>
                                </div>
                            </div>
                        </div>
                      </div>

                      {/* Feed */}
                      <div className="space-y-12">
                        {state.posts.filter(p => p.status === 'APPROVED' || p.authorId === state.currentUser?.id).map(post => (
                            <PostCard 
                              key={post.id} 
                              post={post} 
                              currentUser={state.currentUser} 
                              allUsers={state.users} 
                              onLike={handleLike}
                              onAddComment={(pid, txt, parId) => {
                                const c: Comment = { id: Math.random().toString(36), authorId: state.currentUser!.id, authorName: state.currentUser!.fullName, content: txt, timestamp: Date.now(), replies: [] };
                                setState(prev => ({...prev, posts: prev.posts.map(p => { if(p.id !== pid) return p; if(!parId) return {...p, comments: [...p.comments, c]}; return {...p, comments: p.comments.map(cm => cm.id === parId ? {...cm, replies: [...(cm.replies || []), c]} : cm)}; })}));
                                if(post.authorId !== state.currentUser!.id) { const auth = state.users.find(u => u.id === post.authorId); if(auth) addNotification('COMMENT', `Commented: "${txt}"`, auth, post.authorId, post.id); }
                              }}
                              onDeleteComment={(pid, cid) => setState(prev => ({...prev, posts: prev.posts.map(p => p.id === pid ? {...p, comments: p.comments.filter(c => c.id !== cid).map(c => ({...c, replies: (c.replies||[]).filter(r => r.id !== cid)}))} : p)}))}
                              isAdminView={state.currentUser?.role === 'ADMIN'}
                              onApprove={handlePostAction ? (id) => handlePostAction(id, 'APPROVE') : undefined}
                              onDelete={handlePostAction ? (id) => handlePostAction(id, 'DELETE') : undefined}
                            />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Creative Hub View */}
                  {view === 'CREATIVE_HUB' && (
                    <CreativeHub 
                      currentUser={state.currentUser!}
                      users={state.users}
                      helpRequests={state.helpRequests}
                      onAddRequest={handleAddHelpRequest}
                      onUpdateRequest={handleUpdateHelpRequest}
                      onUpdateUser={handleUpdateUser}
                    />
                  )}

                  {/* Profile View */}
                  {view === 'PROFILE' && (
                    <div className="glass-panel p-12 rounded-[3rem] text-center relative overflow-hidden max-w-4xl mx-auto border border-white/10 shadow-2xl">
                        {/* Cinematic Light Leak */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                        
                        <div className="relative z-10">
                            <div className="inline-block relative mb-8 group">
                              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 rounded-[2.5rem] blur opacity-50 group-hover:opacity-80 transition duration-700"></div>
                              <img src={state.currentUser!.avatar} className="w-40 h-40 rounded-[2.2rem] object-cover border-4 border-black relative z-10" loading="lazy" />
                              <button onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-white text-black p-3 rounded-xl z-20 hover:scale-110 transition shadow-lg"><Camera size={18}/></button>
                              <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onload = () => handleUpdateUser(state.currentUser!.id, { avatar: r.result as string }); r.readAsDataURL(f); } }} />
                            </div>
                            
                            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">{state.currentUser!.fullName}</h2>
                            <div className="flex items-center justify-center gap-2 mb-8">
                              <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded uppercase tracking-[0.2em] border border-indigo-500/20">{state.currentUser!.role}</span>
                              <span className="text-[10px] font-black bg-white/5 text-white/60 px-3 py-1 rounded uppercase tracking-[0.2em] border border-white/5">{state.currentUser!.specialization}</span>
                            </div>

                            {/* App Settings Toggles */}
                            <div className="max-w-md mx-auto mb-12 space-y-4">
                              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-right">
                                  <p className="text-xs font-black text-white tracking-widest uppercase">Cinematic Entrance</p>
                                  <p className="text-[10px] text-white/40 font-medium">Studio-grade view transitions</p>
                                </div>
                                <button 
                                  onClick={toggleCinematicSetting}
                                  className={`w-12 h-6 rounded-full transition-colors relative ${state.settings.cinematicEntrance ? 'bg-indigo-600' : 'bg-white/10'}`}
                                >
                                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${state.settings.cinematicEntrance ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                              </div>
                            </div>
                            
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-2xl mx-auto">
                              {state.currentUser!.badges.map(b => {
                                  const def = BADGE_DEFINITIONS[b.id];
                                  return (
                                    <div key={b.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center hover:bg-white/5 transition group">
                                        <span className="text-2xl mb-2 group-hover:scale-110 transition">{def.icon}</span>
                                        <span className="text-[9px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider">{def.name}</span>
                                    </div>
                                  )
                              })}
                            </div>

                            <div className="max-w-xl mx-auto space-y-6 text-left">
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Display Name</label>
                                  <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold focus:border-indigo-500/50 focus:bg-black/60 outline-none transition" value={state.currentUser!.fullName} onChange={e => handleUpdateUser(state.currentUser!.id, { fullName: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Professional Bio</label>
                                  <textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-medium h-32 resize-none focus:border-indigo-500/50 focus:bg-black/60 outline-none transition leading-relaxed" value={state.currentUser!.bio} onChange={e => handleUpdateUser(state.currentUser!.id, { bio: e.target.value })} />
                              </div>
                            </div>
                        </div>
                    </div>
                  )}

                  {/* Admin View */}
                  {view === 'ADMIN' && (
                    <AdminDashboard 
                        state={state}
                        onUpdateUser={handleUpdateUser}
                        onDeleteUser={(id) => setState(prev => ({...prev, users: prev.users.filter(u => u.id !== id)}))}
                        onPostAction={handlePostAction}
                        onUpdateIdea={handleUpdateIdea}
                        onUpdateLocation={handleUpdateLocation}
                        onAddLocation={handleAddLocation}
                        onDeleteLocation={handleDeleteLocation}
                        onCreateUser={handleCreateUser}
                        onSendNotification={handleSendNotification}
                    />
                  )}

                  {/* Ideas View */}
                  {view === 'IDEAS' && (
                    <div className="space-y-10">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                          <div>
                              <h2 className="text-5xl font-black text-white mb-2 tracking-tighter">Idea Bank</h2>
                              <p className="text-white/40 text-sm font-mono uppercase tracking-widest">Pre-Production Phase</p>
                          </div>
                          <button onClick={() => setNewIdeaForm(p => ({...p, showModal: true}))} className="px-8 py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2">
                              <Plus size={16}/> New Concept
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {state.ideas.map(idea => (
                              <IdeaCard key={idea.id} idea={idea} currentUser={state.currentUser} isTopVoted={idea.id === topIdeaId} onVote={(id) => setState(p => ({...p, ideas: p.ideas.map(i => i.id === id ? {...i, votes: i.votes.includes(state.currentUser!.id) ? i.votes.filter(v => v !== state.currentUser!.id) : [...i.votes, state.currentUser!.id]} : i)}))} />
                          ))}
                        </div>
                        {newIdeaForm.showModal && (
                          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                              <div className="glass-panel w-full max-w-lg p-10 rounded-[2.5rem] relative border border-white/10 shadow-2xl">
                                <button onClick={() => setNewIdeaForm(p => ({...p, showModal: false}))} className="absolute top-8 right-8 text-white/30 hover:text-white transition"><X size={24}/></button>
                                <h3 className="text-3xl font-black text-white mb-8 tracking-tight">New Concept</h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Title</label>
                                      <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-white/30 transition" value={newIdeaForm.title} onChange={e => setNewIdeaForm(p => ({...p, title: e.target.value}))} />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Description</label>
                                      <textarea className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-medium h-32 resize-none outline-none focus:border-white/30 transition" value={newIdeaForm.description} onChange={e => setNewIdeaForm(p => ({...p, description: e.target.value}))} />
                                    </div>
                                    <div className="relative pt-2">
                                      <select className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-bold appearance-none outline-none focus:border-white/30 transition" value={newIdeaForm.type} onChange={e => setNewIdeaForm(p => ({...p, type: e.target.value as any}))}>
                                          <option value="تقرير">Report</option>
                                          <option value="مقابلة">Interview</option>
                                          <option value="تصوير">Photo Shoot</option>
                                          <option value="فيديو">Video Production</option>
                                      </select>
                                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" />
                                    </div>
                                    <button onClick={handleCreateIdea} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition mt-4">Launch Proposal</button>
                                </div>
                              </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Locations View */}
                  {view === 'LOCATIONS' && (
                    <div className="space-y-10">
                        <h2 className="text-5xl font-black text-white tracking-tighter">Location Scouting</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          {state.locations.map(loc => (
                              <div key={loc.id} className="group relative h-80 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                                <img src={loc.image} className="absolute inset-0 w-full h-full object-cover transition duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-40" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                                
                                {/* Cinematic HUD Elements on Image */}
                                <div className="absolute top-6 right-6 border border-white/20 px-3 py-1 rounded text-[9px] font-mono text-white/80 uppercase tracking-widest backdrop-blur-sm">
                                    GPS: 34.0522° N, 118.2437° W
                                </div>

                                <div className="absolute bottom-0 left-0 p-10 w-full translate-y-2 group-hover:translate-y-0 transition duration-500">
                                    <div className="flex justify-between items-end">
                                      <div>
                                          <h3 className="text-3xl font-black text-white mb-2 leading-none">{loc.name}</h3>
                                          <p className="text-white/60 text-sm line-clamp-2 max-w-sm font-medium">{loc.description}</p>
                                      </div>
                                      <div className={`px-4 py-2 rounded-lg border text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md ${loc.status === 'VISITED' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/50 text-amber-400 bg-amber-500/10'}`}>
                                          {loc.status === 'VISITED' ? 'Wrapped' : 'Planned'}
                                      </div>
                                    </div>
                                </div>
                              </div>
                          ))}
                        </div>
                    </div>
                  )}

                  {/* Members View */}
                  {view === 'MEMBERS' && (
                    <div className="space-y-10">
                        <h2 className="text-5xl font-black text-white tracking-tighter">Production Crew</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {state.users.filter(u => u.status === 'ACTIVE').map(user => (
                              <div key={user.id} className="glass-panel p-8 rounded-[2rem] flex flex-col items-center text-center hover:bg-white/5 transition group border border-white/5 hover:border-white/20">
                                <div className="relative mb-6">
                                    <img src={user.avatar} className="w-24 h-24 rounded-[1.5rem] object-cover border-2 border-white/5 group-hover:scale-105 transition duration-500" loading="lazy" />
                                    {user.isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-black rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
                                </div>
                                <h3 className="font-bold text-lg text-white mb-1">{user.fullName}</h3>
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/20 px-2 py-1 rounded bg-indigo-500/5">{user.specialization}</span>
                              </div>
                          ))}
                        </div>
                    </div>
                  )}

                  {/* Canvas View */}
                  {view === 'CANVAS' && (
                    <div className="h-[80vh] w-full glass-panel rounded-[2.5rem] p-6 relative overflow-hidden border border-white/10 shadow-2xl">
                        <CollaborativeCanvas currentUser={state.currentUser!} />
                    </div>
                  )}
                </div>
              </CinematicEntrance>
            </main>
          </div>
        </div>
      ) : (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#050505]"
            ref={containerRef}
            style={{
                // Set initial CSS variables for parallax
                ['--mouse-x' as any]: '0',
                ['--mouse-y' as any]: '0'
            }}
        >
          {/* Background Lens Effects - Rotating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center opacity-30"
               style={{ 
                 transform: `translate3d(calc(var(--mouse-x) * 20px), calc(var(--mouse-y) * 20px), 0)`,
                 transition: 'transform 0.1s linear',
                 willChange: 'transform'
               }}>
             {/* Large outer ring */}
             <div className="w-[80vw] h-[80vw] md:w-[60vw] md:h-[60vw] border border-white/5 rounded-full absolute lens-ring-cw" />
             {/* Middle dashed ring */}
             <div className="w-[60vw] h-[60vw] md:w-[45vw] md:h-[45vw] border border-white/10 rounded-full absolute lens-ring-ccw border-dashed opacity-30" />
             {/* Inner glowing ring */}
             <div className="w-[40vw] h-[40vw] md:w-[30vw] md:h-[30vw] border-[2px] border-indigo-500/10 rounded-full absolute animate-pulse blur-3xl" />
             
             {/* Light Leaks */}
             <div className="cinematic-leak bg-indigo-600 w-[600px] h-[600px] rounded-full opacity-[0.15] -top-40 -left-40 animate-pulse"></div>
             <div className="cinematic-leak bg-rose-600 w-[500px] h-[500px] rounded-full opacity-[0.1] bottom-0 right-0 animation-delay-2000"></div>
          </div>

          {/* Dust Particles */}
          <div className="absolute inset-0 pointer-events-none">
             {Array.from({ length: 15 }).map((_, i) => (
                <div 
                   key={i} 
                   className="dust-particle w-1 h-1 bg-white/20"
                   style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `-${Math.random() * 20}s`,
                      opacity: Math.random() * 0.4
                   }}
                ></div>
             ))}
          </div>

          {/* Shutter Overlay Transition */}
          {loginPhase === 'SUCCESS' && (
              <div className="absolute inset-0 bg-black z-[100] animate-[shutter-snap_0.3s_ease-in-out_forwards]"></div>
          )}

          {/* Intro Sequence: Title */}
          {loginPhase === 'INTRO' && (
            <div className="relative z-50 text-center animate-[reveal-fade_2s_cubic-bezier(0.22,1,0.36,1)_forwards]">
                <div className="mb-4 inline-block relative">
                    <Aperture size={64} className="text-white relative z-10 animate-[spin_10s_linear_infinite]" strokeWidth={1}/>
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
                </div>
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">MEDIA CLUB</h1>
                <p className="text-xs font-mono text-white/60 uppercase tracking-[0.5em] border-t border-b border-white/10 py-2 inline-block">Authorized Members Only</p>
            </div>
          )}

          {/* Login Phase: Viewfinder HUD & Form */}
          {(loginPhase === 'FORM' || loginPhase === 'AUTHENTICATING') && (
            <>
                {/* Custom Login HUD - Technical Camera Overlay */}
                <div className="absolute inset-0 pointer-events-none p-4 md:p-8 z-20 transition-opacity duration-1000 animate-in fade-in" 
                     style={{ 
                       transform: `translate3d(calc(var(--mouse-x) * -10px), calc(var(--mouse-y) * -10px), 0)`,
                       willChange: 'transform'
                     }}>
                    <div className="w-full h-full border border-white/10 rounded-3xl relative opacity-60">
                        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-white/40 rounded-tl-3xl"></div>
                        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-white/40 rounded-tr-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-white/40 rounded-bl-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-white/40 rounded-br-3xl"></div>
                        
                        {/* Live Data Overlay */}
                        <div className="absolute top-6 left-8 flex flex-col gap-1 text-[9px] font-mono text-white/60 tracking-[0.2em]">
                        <span className="text-red-500 animate-pulse flex items-center gap-2">● REC [00:00:00]</span>
                        <span>SHUTTER: 180°</span>
                        <span>WB: 5600K</span>
                        </div>
                        <div className="absolute bottom-6 right-8 flex flex-col items-end gap-1 text-[9px] font-mono text-white/60 tracking-[0.2em]">
                        <span>ISO 800</span>
                        <span>f/2.8</span>
                        <span>LOG-C</span>
                        <span className="text-emerald-400">STBY</span>
                        </div>
                        
                        {/* Crosshair Center */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
                            <div className="w-8 h-8 border border-white/40 flex items-center justify-center rounded-full"></div>
                            <div className="w-[1px] h-4 bg-white/40 absolute -top-4 left-1/2 -translate-x-1/2"></div>
                            <div className="w-[1px] h-4 bg-white/40 absolute -bottom-4 left-1/2 -translate-x-1/2"></div>
                            <div className="h-[1px] w-4 bg-white/40 absolute top-1/2 -left-4 -translate-y-1/2"></div>
                            <div className="h-[1px] w-4 bg-white/40 absolute top-1/2 -right-4 -translate-y-1/2"></div>
                        </div>
                    </div>
                </div>

                <div className="relative z-50 w-full max-w-sm p-6 reveal-cinematic">
                    {/* Main Login Card */}
                    <div id="login-form-container" className="glass-panel backdrop-blur-3xl bg-black/40 border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group hover:border-white/20 transition duration-700">
                        
                        <div className="text-center mb-10 relative">
                        <div className="w-16 h-16 mx-auto mb-6 relative flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                            <div className="absolute inset-0 border border-white/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
                            <div className="absolute inset-0 bg-white/5 rounded-full blur-xl"></div>
                            <Aperture size={28} className="text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight mb-1 drop-shadow-2xl">STUDIO ACCESS</h1>
                        <p className="text-[9px] font-mono text-white/40 uppercase tracking-[0.3em]">Credentials Required</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                        {/* Inputs */}
                        <div className="space-y-5">
                            <CinematicInput 
                                id="username" 
                                label="Agent ID" 
                                value={loginForm.username} 
                                onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                                icon={UserIcon}
                                dimmed={!!focusedField && focusedField !== 'username'}
                                onFocus={() => setFocusedField('username')}
                                onBlur={() => setFocusedField(null)}
                            />
                            
                            <CinematicInput 
                                id="password" 
                                label="Passcode" 
                                value={loginForm.password} 
                                onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                                isPassword={true}
                                dimmed={!!focusedField && focusedField !== 'password'}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>

                        {/* Sound Toggle (Optional) */}
                        <div className="flex justify-center">
                            <button type="button" onClick={() => setSoundEnabled(!soundEnabled)} className="text-[10px] text-white/30 hover:text-white flex items-center gap-2 uppercase tracking-widest transition-colors">
                                {soundEnabled ? <Volume2 size={10} /> : <VolumeX size={10} />}
                                {soundEnabled ? 'Audio Active' : 'Muted'}
                            </button>
                        </div>

                        {/* Shutter Button */}
                        <button 
                            type="submit" 
                            disabled={loginLoading} 
                            className="w-full relative overflow-hidden group/btn bg-white/10 border border-white/10 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:scale-100 shadow-lg active:scale-95"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loginLoading ? <Loader2 size={14} className="animate-spin"/> : <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red]"></div>}
                                {loginLoading ? 'FOCUSING...' : 'INITIALIZE SESSION'}
                            </span>
                            {/* Hover Sweep Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                        </button>
                        </form>
                    </div>
                    
                    <div className="text-center mt-8 opacity-40">
                        <Scan size={24} className="mx-auto mb-2 text-white animate-pulse" strokeWidth={1} />
                        <p className="text-[8px] font-mono text-white uppercase tracking-widest">Biometric Scan Active</p>
                    </div>
                </div>
            </>
          )}
        </div>
      )}
    </CinematicWrapper>
  );
};

export default App;

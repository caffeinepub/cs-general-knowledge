import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import {
  Atom,
  BookOpen,
  ChevronDown,
  Clock,
  Cpu,
  Globe,
  Landmark,
  Lightbulb,
  Loader2,
  MapPin,
  Menu,
  Mic,
  MicOff,
  Palette,
  Send,
  Star,
  Trash2,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SiFacebook, SiInstagram, SiX, SiYoutube } from "react-icons/si";
import { toast } from "sonner";
import type { Message, MessageRole } from "./backend.d";
import {
  useAskQuestion,
  useChatHistory,
  useClearHistory,
} from "./hooks/useQueries";
import { LANGUAGES, getTranslations } from "./translations";

const CATEGORIES = [
  { key: "Science", icon: Atom, color: "text-blue-500" },
  { key: "Geography", icon: MapPin, color: "text-green-500" },
  { key: "Technology", icon: Cpu, color: "text-purple-500" },
  { key: "Arts", icon: Palette, color: "text-pink-500" },
  { key: "History", icon: Clock, color: "text-amber-500" },
  { key: "Sports", icon: Trophy, color: "text-red-500" },
  { key: "Politics", icon: Landmark, color: "text-indigo-500" },
  { key: "General", icon: Star, color: "text-yellow-500" },
];

const FOOTER_LINKS = [
  {
    title: "Links",
    links: ["Home", "Explore", "Learn", "About Us", "Blog", "Contact"],
  },
  {
    title: "Categories",
    links: ["Science", "Geography", "Technology", "Arts", "History", "Sports"],
  },
  {
    title: "Legal",
    links: [
      "Privacy Policy",
      "Terms of Service",
      "Cookie Policy",
      "Disclaimer",
    ],
  },
];

const SOCIAL_ICONS = [
  { name: "facebook", Icon: SiFacebook },
  { name: "twitter", Icon: SiX },
  { name: "instagram", Icon: SiInstagram },
  { name: "youtube", Icon: SiYoutube },
];

function isUser(role: MessageRole | string): boolean {
  return role === "user" || (role as any).__kind__ === "user";
}

export default function App() {
  const [language, setLanguage] = useState("English");
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<
    { role: string; content: string; id: string }[]
  >([]);
  const [isThinking, setIsThinking] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const t = getTranslations(language);

  const { data: history = [], isLoading: historyLoading } = useChatHistory();
  const askQuestion = useAskQuestion();
  const clearHistory = useClearHistory();

  const allMessages = [
    ...history.map((m: Message) => ({
      role: String(m.role),
      content: m.content,
      id: String(m.id),
    })),
    ...localMessages,
  ];

  const allMessagesLen = allMessages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message/thinking change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessagesLen, isThinking]);

  const currentLang = LANGUAGES.find((l) => l.code === language);

  const scrollToChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => inputRef.current?.focus(), 600);
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setInput(`Tell me about ${cat}`);
    scrollToChat();
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isThinking) return;
    const msgId = `local-${Date.now()}`;
    setInput("");
    setActiveCategory(null);
    setLocalMessages((prev) => [
      ...prev,
      { role: "user", content: q, id: msgId },
    ]);
    setIsThinking(true);
    try {
      const answer = await askQuestion.mutateAsync({ question: q, language });
      setLocalMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer, id: `${msgId}-reply` },
      ]);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLocalMessages((prev) => prev.filter((m) => m.id !== msgId));
    } finally {
      setIsThinking(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearHistory.mutateAsync();
      setLocalMessages([]);
      toast.success("History cleared successfully.");
    } catch {
      toast.error("Failed to clear history.");
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(t.voiceNotSupported);
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = currentLang?.bcp47 || "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  const handleSpeak = (text: string, msgId: string) => {
    if (!window.speechSynthesis) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang?.bcp47 || "en-US";
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingMsgId(msgId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-jakarta">
      <Toaster position="top-right" />

      {/* NAV */}
      <header
        className="sticky top-0 z-50 shadow-lg"
        style={{ backgroundColor: "oklch(0.18 0.06 245)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.70 0.12 75), oklch(0.60 0.14 72))",
              }}
            >
              <Lightbulb
                className="w-5 h-5"
                style={{ color: "oklch(0.18 0.06 245)" }}
              />
            </div>
            <span className="text-white font-bold text-sm sm:text-base tracking-wide">
              CS <span className="text-gold">GENERAL</span> KNOWLEDGE
            </span>
          </div>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Main navigation"
          >
            {[t.home, t.explore, t.learn, t.categoriesNav].map((link) => (
              <button
                type="button"
                key={link}
                className="text-white/80 hover:text-gold text-sm font-medium transition-colors"
                data-ocid={`nav.${link.toLowerCase()}.link`}
              >
                {link}
              </button>
            ))}
          </nav>

          {/* Language + Auth */}
          <div className="hidden md:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white border-white/20 bg-white/10 hover:bg-white/20 gap-1.5 text-xs"
                  data-ocid="nav.language.select"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {currentLang?.nativeName || language}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="max-h-64 overflow-y-auto"
              >
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={
                      language === lang.code ? "font-semibold text-gold" : ""
                    }
                  >
                    <span className="mr-2">{lang.nativeName}</span>
                    <span className="text-muted-foreground text-xs">
                      {lang.name}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="text-xs font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.70 0.12 75), oklch(0.60 0.14 72))",
                color: "oklch(0.14 0.055 245)",
              }}
              data-ocid="nav.login.button"
            >
              {t.login} / {t.signUp}
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden text-white p-1"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            data-ocid="nav.menu.toggle"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 overflow-hidden"
              style={{ backgroundColor: "oklch(0.14 0.055 245)" }}
            >
              <div className="px-4 py-3 flex flex-col gap-3">
                {[t.home, t.explore, t.learn, t.categoriesNav].map((link) => (
                  <button
                    type="button"
                    key={link}
                    className="text-white/80 text-sm text-left"
                  >
                    {link}
                  </button>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-white/20 bg-white/10 gap-1.5 text-xs flex-1"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {currentLang?.nativeName || language}
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-48 overflow-y-auto">
                      {LANGUAGES.map((lang) => (
                        <DropdownMenuItem
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setMobileMenuOpen(false);
                          }}
                        >
                          {lang.nativeName}{" "}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {lang.name}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    size="sm"
                    className="text-xs"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.70 0.12 75), oklch(0.60 0.14 72))",
                      color: "oklch(0.14 0.055 245)",
                    }}
                  >
                    {t.login}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO */}
      <section
        className="hero-gradient relative overflow-hidden"
        style={{ minHeight: "420px" }}
        aria-label="Hero"
      >
        <div
          className="absolute top-[-80px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, oklch(0.42 0.09 200), transparent)",
          }}
        />
        <div
          className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, oklch(0.70 0.12 75), transparent)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex-1"
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border border-white/20"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "oklch(0.70 0.12 75)",
              }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              AI-Powered General Knowledge
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Welcome to <span className="text-gold">CS General Knowledge</span>
            </h1>
            <p className="text-white/75 text-lg mb-8 max-w-lg leading-relaxed">
              {t.heroSubtitle}
            </p>
            <Button
              onClick={scrollToChat}
              size="lg"
              className="font-bold text-sm shadow-gold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.70 0.12 75), oklch(0.60 0.14 72))",
                color: "oklch(0.14 0.055 245)",
              }}
              data-ocid="hero.cta.button"
            >
              {t.heroCta}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="hidden lg:flex flex-col gap-3"
          >
            {CATEGORIES.slice(0, 4).map((cat, i) => (
              <motion.button
                type="button"
                key={cat.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 cursor-pointer hover:border-white/30 transition-all text-left"
                style={{ background: "rgba(255,255,255,0.06)" }}
                onClick={() => handleCategoryClick(cat.key)}
              >
                <cat.icon className={`w-4 h-4 ${cat.color}`} />
                <span className="text-white/80 text-sm font-medium">
                  {cat.key}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CHAT */}
      <main
        ref={chatSectionRef}
        id="chat"
        className="flex-1 py-12 px-4"
        style={{ background: "oklch(0.97 0.008 240)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2
              className="text-2xl font-bold"
              style={{ color: "oklch(0.18 0.06 245)" }}
            >
              Ask <span className="text-gold">CS SUBHASH</span>
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Your AI-powered GK companion • {t.languageLabel}:{" "}
              {currentLang?.nativeName}
            </p>
          </div>

          <div
            className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col md:flex-row"
            style={{ minHeight: "540px" }}
          >
            {/* Sidebar */}
            <aside
              className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border flex flex-col"
              style={{ background: "oklch(0.97 0.008 240)" }}
            >
              <div className="px-4 py-3 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t.categories}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-2 flex md:flex-col flex-row flex-wrap gap-1">
                  {CATEGORIES.map((cat, idx) => (
                    <button
                      type="button"
                      key={cat.key}
                      onClick={() => handleCategoryClick(cat.key)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full text-left ${
                        activeCategory === cat.key
                          ? "text-white"
                          : "text-foreground/70 hover:text-foreground hover:bg-border/40"
                      }`}
                      style={
                        activeCategory === cat.key
                          ? {
                              background:
                                "linear-gradient(90deg, oklch(0.70 0.12 75), oklch(0.60 0.14 72))",
                              color: "oklch(0.14 0.055 245)",
                            }
                          : {}
                      }
                      data-ocid={`sidebar.category.item.${idx + 1}`}
                    >
                      <cat.icon
                        className={`w-4 h-4 shrink-0 ${activeCategory === cat.key ? "" : cat.color}`}
                      />
                      {cat.key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 border-t border-border">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs text-destructive hover:text-destructive"
                      data-ocid="sidebar.clear_history.open_modal_button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t.clearHistory}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-ocid="clear_history.dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.confirmClear}</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-ocid="clear_history.cancel_button">
                        {t.confirmNo}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClear}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-ocid="clear_history.confirm_button"
                      >
                        {t.confirmYes}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </aside>

            {/* Chat pane */}
            <div className="flex-1 flex flex-col">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.70 0.12 75), oklch(0.60 0.14 72))",
                    color: "oklch(0.14 0.055 245)",
                  }}
                >
                  S
                </div>
                <div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: "oklch(0.18 0.06 245)" }}
                  >
                    CS SUBHASH (AI)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">
                      Online • {t.languageLabel}: {currentLang?.nativeName}
                    </span>
                  </div>
                </div>
                {/* Voice status indicator */}
                {isListening && (
                  <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-600 font-medium">
                      {t.listening}
                    </span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <ScrollArea
                className="flex-1 px-5 py-4"
                style={{ height: "380px" }}
              >
                {historyLoading ? (
                  <div
                    className="flex items-center justify-center h-32"
                    data-ocid="chat.loading_state"
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : allMessages.length === 0 && !isThinking ? (
                  <div
                    className="flex flex-col items-center justify-center h-48 text-center"
                    data-ocid="chat.empty_state"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                      style={{ background: "oklch(0.93 0.04 82)" }}
                    >
                      <BookOpen className="w-7 h-7 text-gold" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {t.noHistory}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {allMessages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-3 ${
                          isUser(msg.role) ? "flex-row-reverse" : "flex-row"
                        }`}
                        data-ocid={`chat.message.item.${idx + 1}`}
                      >
                        {isUser(msg.role) ? (
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback
                              className="text-xs font-bold text-white"
                              style={{ background: "oklch(0.50 0.18 264)" }}
                            >
                              {t.you[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg, oklch(0.70 0.12 75), oklch(0.60 0.14 72))",
                              color: "oklch(0.14 0.055 245)",
                            }}
                          >
                            S
                          </div>
                        )}
                        <div className="max-w-[75%]">
                          {!isUser(msg.role) && (
                            <p
                              className="text-xs font-semibold mb-1"
                              style={{ color: "oklch(0.18 0.06 245)" }}
                            >
                              CS SUBHASH (AI)
                            </p>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              isUser(msg.role)
                                ? "text-white rounded-tr-sm"
                                : "border rounded-tl-sm"
                            }`}
                            style={
                              isUser(msg.role)
                                ? { background: "oklch(0.50 0.18 264)" }
                                : {
                                    background: "oklch(0.93 0.04 82)",
                                    borderColor: "oklch(0.70 0.12 75 / 0.35)",
                                  }
                            }
                          >
                            {msg.content}
                          </div>
                          {/* TTS button for AI messages */}
                          {!isUser(msg.role) && (
                            <button
                              type="button"
                              onClick={() => handleSpeak(msg.content, msg.id)}
                              title={t.voiceOutput}
                              className={`mt-1 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
                                speakingMsgId === msg.id
                                  ? "text-gold bg-amber-50 border border-amber-200"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                              data-ocid={`chat.voice_output.button.${idx + 1}`}
                            >
                              <Volume2
                                className={`w-3 h-3 ${
                                  speakingMsgId === msg.id
                                    ? "animate-pulse"
                                    : ""
                                }`}
                              />
                              <span>{t.voiceOutput}</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    <AnimatePresence>
                      {isThinking && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="flex gap-3"
                          data-ocid="chat.ai.loading_state"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg, oklch(0.70 0.12 75), oklch(0.60 0.14 72))",
                              color: "oklch(0.14 0.055 245)",
                            }}
                          >
                            S
                          </div>
                          <div>
                            <p
                              className="text-xs font-semibold mb-1"
                              style={{ color: "oklch(0.18 0.06 245)" }}
                            >
                              CS SUBHASH (AI)
                            </p>
                            <div
                              className="rounded-2xl rounded-tl-sm px-4 py-3 border"
                              style={{
                                background: "oklch(0.93 0.04 82)",
                                borderColor: "oklch(0.70 0.12 75 / 0.35)",
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-gold" />
                                <span className="text-sm text-muted-foreground italic">
                                  {t.thinking}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={chatBottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input bar */}
              <div className="px-4 py-3 border-t border-border">
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? t.listening : t.askPlaceholder}
                    disabled={isThinking}
                    className="flex-1 rounded-full border-border/60 bg-muted/40 text-sm"
                    data-ocid="chat.question.input"
                  />
                  {/* Mic button */}
                  <Button
                    type="button"
                    onClick={handleVoiceInput}
                    disabled={isThinking}
                    variant={isListening ? "default" : "outline"}
                    className={`rounded-full w-10 h-10 p-0 shrink-0 ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600 border-red-500"
                        : ""
                    }`}
                    title={isListening ? "Stop listening" : t.voiceInput}
                    data-ocid="chat.voice_input.button"
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4 animate-pulse" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                  {/* Send button */}
                  <Button
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className="rounded-full w-10 h-10 p-0 shrink-0 shadow-gold"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.70 0.12 75), oklch(0.60 0.14 72))",
                      color: "oklch(0.14 0.055 245)",
                    }}
                    data-ocid="chat.send.button"
                  >
                    {isThinking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        style={{ backgroundColor: "oklch(0.14 0.055 245)" }}
        aria-label="Footer"
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.70 0.12 75), oklch(0.60 0.14 72))",
                  }}
                >
                  <Lightbulb
                    className="w-4 h-4"
                    style={{ color: "oklch(0.14 0.055 245)" }}
                  />
                </div>
                <span className="text-white font-bold text-sm">CS GK</span>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">
                AI-powered general knowledge for everyone, in every language.
              </p>
              <div className="flex items-center gap-3 mt-4">
                {SOCIAL_ICONS.map(({ name, Icon }) => (
                  <a
                    key={name}
                    href="https://caffeine.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-white/15 text-white/50 hover:text-gold hover:border-gold/50 transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h3 className="text-white text-sm font-semibold mb-3">
                  {col.title}
                </h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="https://caffeine.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/50 text-xs hover:text-gold transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-white/40 text-xs">
              © {new Date().getFullYear()} CS General Knowledge. All rights
              reserved.
            </p>
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 text-xs hover:text-white/60 transition-colors"
            >
              Built with ❤️ using caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

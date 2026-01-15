import React, { useState, useEffect } from 'react';
import { Menu, X, Settings, BookOpen, Scroll, LogOut, Heart, ExternalLink } from 'lucide-react';
import { missionTiers } from './missionData';
import { useAuth } from './AuthContext';
import AuthScreen from './AuthScreen';

const App = () => {
  const { user, userData, loading, logout, saveGameState: saveToFirebase, saveSettings: saveSettingsToFirebase } = useAuth();

  const [gameState, setGameState] = useState({
    rank: 0,
    integrity: 0,
    discipline: 0,
    courage: 0,
    humility: 0,
    consistency: 0,
    currentAct: null,
    completedToday: false,
    lastCompletedDate: null,
    narrativeState: 'encouraging',
    totalActs: 0,
    unseenActs: 0,
    history: [],
    completedMissions: [],
    missionInProgress: null
  });

  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  const [emotionTags, setEmotionTags] = useState([]);
  const [toldAnyone, setToldAnyone] = useState(null);
  const [showLossEvent, setShowLossEvent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [settings, setSettings] = useState({
    soundEnabled: false,
    dailyReminder: false,
    darkMode: false
  });

  const ranks = [
    'The Unnamed',
    'The Veiled',
    'The Quiet One',
    'The Watchful',
    'The Faithful',
    'The Steward'
  ];

  const secretActs = {
    service: [
      "Do a good deed today that no one can trace to you.",
      "Clean something that isn't yours without acknowledgment.",
      "Help someone who will never know it was you.",
      "Give away something you value, anonymously.",
      "Pay for someone's purchase without their knowledge."
    ],
    restraint: [
      "Refrain from a response you feel justified in making.",
      "Do not correct someone even though you know you're right.",
      "Resist an impulse you usually indulge.",
      "Keep a secret someone shared, without mentioning you kept it.",
      "Decline praise you could have accepted."
    ],
    discipline: [
      "Complete a task you've been avoiding, in silence.",
      "Exercise without tracking or sharing it.",
      "Study something difficult for no external reward.",
      "Maintain a practice you've committed to, unseen.",
      "Wake early and use the time for something meaningful."
    ],
    courage: [
      "Speak a difficult truth to someone in private.",
      "Set a boundary without explaining yourself.",
      "Apologize without justifying your actions.",
      "Stand alone for something you believe, quietly.",
      "Face a fear without telling anyone about it."
    ],
    mercy: [
      "Forgive someone who doesn't know they need it.",
      "Show patience when you could be irritated.",
      "Offer grace to someone who wronged you.",
      "Let go of being right in a disagreement.",
      "Think compassionately of someone you dislike."
    ]
  };

  const emotionOptions = [
    'Peace', 'Resistance', 'Fear', 'Clarity',
    'Doubt', 'Strength', 'Humility', 'Joy'
  ];

  const narrativeMessages = {
    encouraging: [
      "Well done.",
      "This was noticed.",
      "Carry on.",
      "You chose well."
    ],
    observant: [
      "You chose silence.",
      "This mattered.",
      "The choice was yours.",
      "Witnessed."
    ],
    sparse: [
      "Yes.",
      "This.",
      "Known.",
      "..."
    ]
  };

  // Load user data from Firebase when available
  useEffect(() => {
    if (userData?.gameState) {
      setGameState(userData.gameState);
    }
    if (userData?.settings) {
      setSettings(userData.settings);
    }
  }, [userData]);

  useEffect(() => {
    setMounted(true);

    // Hide splash screen after app is ready
    const timer = setTimeout(() => {
      const splashScreen = document.getElementById('splash-screen');
      if (splashScreen) {
        splashScreen.classList.add('hidden');
        setTimeout(() => {
          splashScreen.remove();
        }, 500);
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // Check for daily act when user data loads
  useEffect(() => {
    if (user && userData?.gameState) {
      checkForDailyAct(userData.gameState);
    }
  }, [user, userData]);

  const saveGameState = async (newState) => {
    setGameState(newState);
    if (user) {
      await saveToFirebase(newState);
    }
  };

  const checkForDailyAct = (state) => {
    const today = new Date().toDateString();
    if (state.lastCompletedDate !== today && !state.currentAct) {
      // Don't auto-generate, let user request
    }
  };

  const generateNewAct = async () => {
    const categories = Object.keys(secretActs);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const acts = secretActs[category];
    const act = acts[Math.floor(Math.random() * acts.length)];

    const newState = {
      ...gameState,
      currentAct: { text: act, category },
      completedToday: false
    };
    await saveGameState(newState);
    // Scroll to top when receiving new act
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const completeAct = async (told) => {
    setToldAnyone(told);

    if (told) {
      const newState = {
        ...gameState,
        totalActs: gameState.totalActs + 1,
        completedToday: true,
        lastCompletedDate: new Date().toDateString(),
        history: [...gameState.history, {
          act: gameState.currentAct.text,
          date: new Date().toISOString(),
          seen: true
        }]
      };
      await saveGameState(newState);
    } else {
      const integrityGain = 15 + Math.floor(Math.random() * 10);
      const statGain = 5 + Math.floor(Math.random() * 8);

      const newState = {
        ...gameState,
        integrity: gameState.integrity + integrityGain,
        discipline: gameState.discipline + statGain,
        courage: gameState.courage + statGain,
        humility: gameState.humility + statGain,
        consistency: gameState.consistency + statGain,
        totalActs: gameState.totalActs + 1,
        unseenActs: gameState.unseenActs + 1,
        completedToday: true,
        lastCompletedDate: new Date().toDateString(),
        history: [...gameState.history, {
          act: gameState.currentAct.text,
          date: new Date().toISOString(),
          seen: false
        }]
      };

      const totalXP = newState.integrity + newState.discipline + newState.courage + newState.humility + newState.consistency;
      const newRank = Math.min(Math.floor(totalXP / 200), ranks.length - 1);
      newState.rank = newRank;

      if (newState.unseenActs > 20) {
        newState.narrativeState = 'sparse';
      } else if (newState.unseenActs > 10) {
        newState.narrativeState = 'observant';
      }

      await saveGameState(newState);

      if (newState.unseenActs > 5 && Math.random() < 0.15) {
        setTimeout(() => setShowLossEvent(true), 2000);
      }
    }

    setShowReflection(true);
  };

  const acceptLoss = async () => {
    const newState = {
      ...gameState,
      integrity: Math.max(0, gameState.integrity - 30),
      discipline: Math.max(0, gameState.discipline - 10),
    };
    await saveGameState(newState);
    setShowLossEvent(false);
  };

  const declineLoss = () => {
    setShowLossEvent(false);
  };

  const finishReflection = async () => {
    setShowReflection(false);
    setReflection('');
    setEmotionTags([]);
    setToldAnyone(null);

    const newState = {
      ...gameState,
      currentAct: null,
      missionInProgress: null
    };

    if (gameState.currentAct?.isMission && !toldAnyone && gameState.missionInProgress) {
      newState.completedMissions = [...gameState.completedMissions, gameState.missionInProgress.id];
    }

    await saveGameState(newState);
    // Scroll to top after finishing reflection
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleEmotion = (emotion) => {
    setEmotionTags(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const getNarrativeMessage = () => {
    const messages = narrativeMessages[gameState.narrativeState];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getProgressSymbol = () => {
    const level = Math.floor(gameState.unseenActs / 3);
    return '◦'.repeat(Math.min(level, 12));
  };

  const openMenu = (panel) => {
    setActivePanel(panel);
    setMenuOpen(true);
    // Scroll menu content to top when opening a panel
    setTimeout(() => {
      const menuContent = document.querySelector('.menu-content');
      if (menuContent) menuContent.scrollTop = 0;
    }, 0);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setActivePanel(null);
    setSelectedMission(null);
    // Scroll main page to top when closing menu
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isTierUnlocked = (tier) => {
    return gameState.unseenActs >= missionTiers[tier].requiredActs;
  };

  const selectMission = (mission) => {
    if (gameState.missionInProgress || gameState.currentAct) {
      return;
    }
    setSelectedMission(mission);
  };

  const startMission = async () => {
    if (!selectedMission) return;

    const newState = {
      ...gameState,
      missionInProgress: selectedMission,
      currentAct: { text: selectedMission.text, category: selectedMission.category, isMission: true }
    };
    await saveGameState(newState);
    closeMenu();
  };

  const toggleSetting = async (setting) => {
    const newSettings = {
      ...settings,
      [setting]: !settings[setting]
    };
    setSettings(newSettings);
    if (user) {
      await saveSettingsToFirebase(newSettings);
    }
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  // Show loading while checking auth
  if (loading) {
    return null; // Splash screen handles this
  }

  // Show auth screen if not logged in
  if (!user) {
    return <AuthScreen />;
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-stone-100 p-6 font-serif">
      <div className="max-w-2xl mx-auto">
        {/* Menu Button */}
        <div className="absolute top-6 right-6 fade-in">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-3 glass rounded-full hover:bg-amber-50 transition-all duration-300"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-amber-900" />
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12 fade-in">
          <h1 className="text-6xl font-light tracking-wider text-amber-900 mb-2 gold-glow">
            NSecret
          </h1>
          <p className="text-sm tracking-widest text-amber-800/60 uppercase accent-text">
            Unseen good. Real impact.
          </p>
        </div>

        {/* Rank Display */}
        <div className="text-center mb-8 fade-in" style={{animationDelay: '0.2s'}}>
          <div className="inline-block seal rounded-full px-8 py-3">
            <p className="text-2xl text-amber-900 font-light tracking-wide">
              {ranks[gameState.rank]}
            </p>
          </div>
          <div className="mt-3 text-amber-800/40 tracking-widest text-xs">
            {getProgressSymbol()}
          </div>
        </div>

        {/* Main Content */}
        {!gameState.currentAct && !gameState.completedToday && (
          <div className="glass rounded-lg p-12 text-center fade-in" style={{animationDelay: '0.4s'}}>
            <p className="text-xl text-amber-900 mb-6 leading-relaxed">
              The day awaits.
            </p>
            <button
              onClick={generateNewAct}
              className="px-8 py-3 bg-gradient-to-r from-amber-800 to-amber-900 text-white rounded-full hover:from-amber-900 hover:to-amber-950 transition-all duration-300 tracking-wide accent-text"
            >
              Receive Today's Act
            </button>
          </div>
        )}

        {gameState.currentAct && !gameState.completedToday && !showReflection && (
          <div className="glass rounded-lg p-12 fade-in" style={{animationDelay: '0.4s'}}>
            <div className="text-center mb-8">
              <p className="text-sm tracking-widest text-amber-800/60 uppercase mb-4 accent-text">
                {gameState.currentAct.category}
              </p>
              <p className="text-3xl text-amber-900 leading-relaxed font-light">
                "{gameState.currentAct.text}"
              </p>
            </div>

            <div className="border-t border-amber-900/20 pt-8 mt-8">
              <p className="text-sm text-amber-800/80 mb-6 text-center leading-relaxed">
                Complete this act in the world. Return when done.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => completeAct(false)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-800 to-amber-900 text-white rounded-lg hover:from-amber-900 hover:to-amber-950 transition-all duration-300 accent-text tracking-wide"
                >
                  I completed this, unseen
                </button>
                <button
                  onClick={() => completeAct(true)}
                  className="flex-1 px-6 py-4 bg-white border border-amber-900/30 text-amber-900 rounded-lg hover:bg-amber-50 transition-all duration-300 accent-text tracking-wide"
                >
                  I completed this, but told someone
                </button>
              </div>
            </div>
          </div>
        )}

        {showReflection && (
          <div className="glass rounded-lg p-12 fade-in">
            <div className="text-center mb-8">
              <p className="text-4xl text-amber-900 mb-4 gold-glow">
                {getNarrativeMessage()}
              </p>
              {toldAnyone && (
                <p className="text-sm text-amber-800/60 italic">
                  Good, but seen.
                </p>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-amber-800/70 mb-3 tracking-wide accent-text">
                  How did this feel? (optional)
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {emotionOptions.map(emotion => (
                    <button
                      key={emotion}
                      onClick={() => toggleEmotion(emotion)}
                      className={`px-4 py-2 rounded-full text-sm transition-all duration-300 accent-text ${
                        emotionTags.includes(emotion)
                          ? 'bg-amber-900 text-white'
                          : 'bg-white border border-amber-900/30 text-amber-900 hover:bg-amber-50'
                      }`}
                    >
                      {emotion}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-amber-800/70 mb-3 tracking-wide accent-text">
                  Private reflection (optional)
                </p>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="This will never be analyzed or shared..."
                  className="w-full p-4 rounded-lg border border-amber-900/20 bg-white/50 text-amber-900 placeholder-amber-800/30 focus:outline-none focus:border-amber-900/40 resize-none accent-text"
                  rows="4"
                />
              </div>

              <button
                onClick={finishReflection}
                className="w-full px-6 py-4 bg-gradient-to-r from-amber-800 to-amber-900 text-white rounded-lg hover:from-amber-900 hover:to-amber-950 transition-all duration-300 accent-text tracking-wide"
              >
                Return to the world
              </button>
            </div>
          </div>
        )}

        {gameState.completedToday && !gameState.currentAct && !showReflection && (
          <div className="glass rounded-lg p-12 text-center fade-in">
            <p className="text-2xl text-amber-900 mb-4 leading-relaxed">
              Rest now.
            </p>
            <p className="text-sm text-amber-800/60 leading-relaxed">
              Return tomorrow for your next act.
            </p>
            <div className="mt-8 pt-8 border-t border-amber-900/20">
              <p className="text-xs text-amber-800/40 tracking-widest accent-text">
                ACTS COMPLETED: {gameState.totalActs}
              </p>
            </div>
          </div>
        )}

        {/* Sacred Loss Event */}
        {showLossEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 fade-in">
            <div className="glass rounded-lg p-12 max-w-md">
              <div className="text-center mb-8">
                <p className="text-3xl text-amber-900 mb-6 leading-relaxed">
                  Sacred Loss
                </p>
                <p className="text-amber-900/80 leading-relaxed">
                  Are you willing to lose today's reward to affirm your oath?
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={acceptLoss}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-800 to-amber-900 text-white rounded-lg hover:from-amber-900 hover:to-amber-950 transition-all duration-300 accent-text"
                >
                  I accept
                </button>
                <button
                  onClick={declineLoss}
                  className="flex-1 px-6 py-4 bg-white border border-amber-900/30 text-amber-900 rounded-lg hover:bg-amber-50 transition-all duration-300 accent-text"
                >
                  Not today
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Panel */}
        {menuOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 fade-in">
            <div className="glass rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-amber-900/20">
                <h2 className="text-2xl text-amber-900 font-light tracking-wide">
                  {activePanel === 'missions' ? 'Missions' : activePanel === 'settings' ? 'Settings' : activePanel === 'updates' ? 'Updates' : activePanel === 'give' ? 'Give' : 'Menu'}
                </h2>
                <button
                  onClick={closeMenu}
                  className="p-2 hover:bg-amber-50 rounded-full transition-all duration-300"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6 text-amber-900" />
                </button>
              </div>

              {/* Menu Content */}
              <div className="menu-content flex-1 overflow-y-auto p-6">
                {!activePanel && (
                  <div className="space-y-4">
                    {/* User Info */}
                    <div className="p-4 bg-amber-900/5 rounded-lg mb-6">
                      <p className="text-sm text-amber-800/60 accent-text">Signed in as</p>
                      <p className="text-amber-900 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => openMenu('missions')}
                      className="w-full p-6 glass rounded-lg hover:bg-amber-50 transition-all duration-300 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <Scroll className="w-6 h-6 text-amber-900" />
                        <div>
                          <h3 className="text-xl text-amber-900 font-light mb-1">Missions</h3>
                          <p className="text-sm text-amber-800/60 accent-text">Choose your path, when ready</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => openMenu('settings')}
                      className="w-full p-6 glass rounded-lg hover:bg-amber-50 transition-all duration-300 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <Settings className="w-6 h-6 text-amber-900" />
                        <div>
                          <h3 className="text-xl text-amber-900 font-light mb-1">Settings</h3>
                          <p className="text-sm text-amber-800/60 accent-text">Adjust your preferences</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => openMenu('updates')}
                      className="w-full p-6 glass rounded-lg hover:bg-amber-50 transition-all duration-300 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <BookOpen className="w-6 h-6 text-amber-900" />
                        <div>
                          <h3 className="text-xl text-amber-900 font-light mb-1">Updates</h3>
                          <p className="text-sm text-amber-800/60 accent-text">What has changed</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => openMenu('give')}
                      className="w-full p-6 glass rounded-lg hover:bg-amber-50 transition-all duration-300 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <Heart className="w-6 h-6 text-amber-900" />
                        <div>
                          <h3 className="text-xl text-amber-900 font-light mb-1">Give</h3>
                          <p className="text-sm text-amber-800/60 accent-text">Support good in the world</p>
                        </div>
                      </div>
                    </button>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full p-6 glass rounded-lg hover:bg-red-50 transition-all duration-300 text-left mt-4"
                    >
                      <div className="flex items-center gap-4">
                        <LogOut className="w-6 h-6 text-red-700" />
                        <div>
                          <h3 className="text-xl text-red-700 font-light mb-1">Sign Out</h3>
                          <p className="text-sm text-red-700/60 accent-text">Leave for now</p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Missions Panel */}
                {activePanel === 'missions' && (
                  <div className="space-y-6">
                    <p className="text-amber-800/70 leading-relaxed accent-text text-center mb-8">
                      {gameState.currentAct || gameState.missionInProgress
                        ? "Complete your current practice before choosing another."
                        : "Choose a practice when you feel called. There is no rush."}
                    </p>

                    {Object.entries(missionTiers).map(([tierId, tier]) => {
                      const isUnlocked = isTierUnlocked(tierId);
                      return (
                        <div key={tierId} className={`${!isUnlocked ? 'opacity-50' : ''}`}>
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg text-amber-900 font-light tracking-wide">
                                {tier.name}
                              </h3>
                              {!isUnlocked && (
                                <span className="text-xs text-amber-800/60 accent-text">
                                  {tier.requiredActs} unseen acts needed
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {tier.missions.map((mission) => {
                              const isCompleted = gameState.completedMissions.includes(mission.id);
                              const isSelected = selectedMission?.id === mission.id;
                              const canSelect = isUnlocked && !gameState.currentAct && !gameState.missionInProgress;

                              return (
                                <button
                                  key={mission.id}
                                  onClick={() => canSelect && selectMission(mission)}
                                  disabled={!canSelect || isCompleted}
                                  className={`w-full p-4 rounded-lg text-left transition-all duration-300 ${
                                    isCompleted
                                      ? 'bg-amber-900/10 border border-amber-900/20'
                                      : isSelected
                                      ? 'bg-amber-900 text-white border border-amber-900'
                                      : canSelect
                                      ? 'bg-white border border-amber-900/30 hover:bg-amber-50'
                                      : 'bg-white/50 border border-amber-900/10 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <p className={`text-sm mb-1 uppercase tracking-widest accent-text ${
                                        isSelected ? 'text-amber-100/80' : 'text-amber-800/60'
                                      }`}>
                                        {mission.category}
                                      </p>
                                      <p className={`leading-relaxed ${
                                        isCompleted ? 'text-amber-900/50 line-through' : isSelected ? 'text-white' : 'text-amber-900'
                                      }`}>
                                        {mission.text}
                                      </p>
                                    </div>
                                    {isCompleted && (
                                      <span className="text-xs text-amber-900/50 accent-text mt-1">✓</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {selectedMission && !gameState.currentAct && (
                      <div className="sticky bottom-0 pt-6 pb-2 bg-gradient-to-t from-white via-white to-transparent">
                        <button
                          onClick={startMission}
                          className="w-full px-6 py-4 bg-gradient-to-r from-amber-800 to-amber-900 text-white rounded-lg hover:from-amber-900 hover:to-amber-950 transition-all duration-300 accent-text tracking-wide"
                        >
                          Begin this practice
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Panel */}
                {activePanel === 'settings' && (
                  <div className="space-y-6">
                    <p className="text-amber-800/70 leading-relaxed accent-text text-center mb-8">
                      Adjust as you wish. These are yours alone.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-amber-900/20">
                        <div>
                          <h3 className="text-amber-900 mb-1">Sound</h3>
                          <p className="text-sm text-amber-800/60 accent-text">Gentle notifications</p>
                        </div>
                        <button
                          onClick={() => toggleSetting('soundEnabled')}
                          className={`w-12 h-6 rounded-full transition-all duration-300 ${
                            settings.soundEnabled ? 'bg-amber-900' : 'bg-amber-900/20'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                            settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-amber-900/20">
                        <div>
                          <h3 className="text-amber-900 mb-1">Daily Reminder</h3>
                          <p className="text-sm text-amber-800/60 accent-text">A quiet nudge each day</p>
                        </div>
                        <button
                          onClick={() => toggleSetting('dailyReminder')}
                          className={`w-12 h-6 rounded-full transition-all duration-300 ${
                            settings.dailyReminder ? 'bg-amber-900' : 'bg-amber-900/20'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                            settings.dailyReminder ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-amber-900/20">
                        <div>
                          <h3 className="text-amber-900 mb-1">Dark Mode</h3>
                          <p className="text-sm text-amber-800/60 accent-text">For evening contemplation</p>
                        </div>
                        <button
                          onClick={() => toggleSetting('darkMode')}
                          className={`w-12 h-6 rounded-full transition-all duration-300 ${
                            settings.darkMode ? 'bg-amber-900' : 'bg-amber-900/20'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                            settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-amber-900/20">
                      <p className="text-xs text-amber-800/40 text-center italic leading-relaxed">
                        Your progress is saved securely to your account.
                      </p>
                    </div>
                  </div>
                )}

                {/* Updates Panel */}
                {activePanel === 'updates' && (
                  <div className="space-y-6">
                    <div className="space-y-8">
                      <div>
                        <div className="flex items-baseline gap-3 mb-3">
                          <h3 className="text-lg text-amber-900 font-light">Version 1.2</h3>
                          <span className="text-xs text-amber-800/60 accent-text">Recent</span>
                        </div>
                        <ul className="space-y-2 text-amber-800/80 leading-relaxed">
                          <li className="flex gap-2">
                            <span className="text-amber-900/40">•</span>
                            <span>Account sync — your journey travels with you</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-amber-900/40">•</span>
                            <span>Sign in with Google or email</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-amber-900/40">•</span>
                            <span>Progress saved securely to the cloud</span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-3 mb-3">
                          <h3 className="text-lg text-amber-900 font-light">Version 1.1</h3>
                          <span className="text-xs text-amber-800/60 accent-text">Previous</span>
                        </div>
                        <ul className="space-y-2 text-amber-800/80 leading-relaxed">
                          <li className="flex gap-2">
                            <span className="text-amber-900/40">•</span>
                            <span>Added Missions — choose your own practices when ready</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-amber-900/40">•</span>
                            <span>Mission tiers unlock gently as you progress</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-amber-900/40">•</span>
                            <span>Settings for sound and reminders</span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-3 mb-3">
                          <h3 className="text-lg text-amber-900 font-light">Version 1.0</h3>
                          <span className="text-xs text-amber-800/60 accent-text">Foundation</span>
                        </div>
                        <ul className="space-y-2 text-amber-800/80 leading-relaxed">
                          <li className="flex gap-2">
                            <span className="text-amber-900/40">•</span>
                            <span>Daily secret acts across five virtues</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-amber-900/40">•</span>
                            <span>Integrity tracking and hidden progression</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-amber-900/40">•</span>
                            <span>Sacred loss events for deeper practice</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-amber-900/40">•</span>
                            <span>Private reflection without analysis</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-amber-900/20">
                      <p className="text-xs text-amber-800/40 text-center italic leading-relaxed">
                        This remains a practice, not a product. Updates will be rare and considered.
                      </p>
                    </div>
                  </div>
                )}

                {/* Give Panel */}
                {activePanel === 'give' && (
                  <div className="space-y-6">
                    <p className="text-amber-800/70 leading-relaxed accent-text text-center mb-8">
                      Generosity, like virtue, is best when unseen.
                    </p>

                    {/* Support NSecret */}
                    <div className="space-y-4">
                      <h3 className="text-lg text-amber-900 font-light tracking-wide">Support NSecret</h3>
                      <a
                        href="https://www.paypal.com/paypalme/ychristdonations"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full p-5 bg-white rounded-lg border border-amber-900/20 hover:bg-amber-50 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#003087] rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">P</span>
                            </div>
                            <div>
                              <h4 className="text-amber-900 mb-1">Donate via PayPal</h4>
                              <p className="text-sm text-amber-800/60 accent-text">Help keep this practice alive</p>
                            </div>
                          </div>
                          <ExternalLink className="w-5 h-5 text-amber-800/40" />
                        </div>
                      </a>

                      {/* About YCHRIST */}
                      <div className="p-5 bg-amber-50/50 rounded-lg border border-amber-900/10">
                        <p className="text-amber-900/80 leading-relaxed text-sm mb-3">
                          NSecret was born from a simple belief: that small acts of hidden kindness can change the world, one heart at a time.
                        </p>
                        <p className="text-amber-800/70 leading-relaxed text-sm mb-3">
                          This app is a labor of love, created by <span className="font-medium text-amber-900">YCHRIST</span> — an organization with a mission close to our hearts: uplifting the less fortunate and spreading hope to those who need it most.
                        </p>
                        <p className="text-amber-800/70 leading-relaxed text-sm">
                          We're deeply grateful to our partners at <span className="font-medium text-amber-900">YGamify App Development</span>, who generously donated their time and talent to bring NSecret to life. Together, we believe that technology can be a force for good — not for fame, but for quiet transformation.
                        </p>
                        <p className="text-amber-800/60 leading-relaxed text-xs mt-4 italic text-center">
                          Every donation helps us continue this mission. Thank you for being part of something beautiful.
                        </p>
                      </div>
                    </div>

                    {/* Donate to Charity */}
                    <div className="space-y-4 pt-6 border-t border-amber-900/20">
                      <h3 className="text-lg text-amber-900 font-light tracking-wide">Give to Others</h3>
                      <p className="text-sm text-amber-800/60 leading-relaxed">
                        Extend your practice beyond this app. Support causes that matter.
                      </p>

                      <a
                        href="https://www.charitynavigator.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full p-5 bg-white rounded-lg border border-amber-900/20 hover:bg-amber-50 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                              <Heart className="w-5 h-5 text-amber-900" />
                            </div>
                            <div>
                              <h4 className="text-amber-900 mb-1">Charity Navigator</h4>
                              <p className="text-sm text-amber-800/60 accent-text">Find and donate to vetted charities</p>
                            </div>
                          </div>
                          <ExternalLink className="w-5 h-5 text-amber-800/40" />
                        </div>
                      </a>

                      <a
                        href="https://www.givewell.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full p-5 bg-white rounded-lg border border-amber-900/20 hover:bg-amber-50 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                              <Heart className="w-5 h-5 text-amber-900" />
                            </div>
                            <div>
                              <h4 className="text-amber-900 mb-1">GiveWell</h4>
                              <p className="text-sm text-amber-800/60 accent-text">High-impact, evidence-based giving</p>
                            </div>
                          </div>
                          <ExternalLink className="w-5 h-5 text-amber-800/40" />
                        </div>
                      </a>

                      <a
                        href="https://www.globalgiving.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full p-5 bg-white rounded-lg border border-amber-900/20 hover:bg-amber-50 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                              <Heart className="w-5 h-5 text-amber-900" />
                            </div>
                            <div>
                              <h4 className="text-amber-900 mb-1">GlobalGiving</h4>
                              <p className="text-sm text-amber-800/60 accent-text">Support grassroots projects worldwide</p>
                            </div>
                          </div>
                          <ExternalLink className="w-5 h-5 text-amber-800/40" />
                        </div>
                      </a>
                    </div>

                    <div className="pt-6 border-t border-amber-900/20">
                      <p className="text-xs text-amber-800/40 text-center italic leading-relaxed">
                        The greatest gifts are those given without expectation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 fade-in" style={{animationDelay: '0.6s'}}>
          <p className="text-xs text-amber-800/40 tracking-widest italic">
            No sharing. No proof. No applause.
          </p>
          <p className="text-[11px] text-amber-800/50 mt-3 tracking-wide">
            Made by YGamify
          </p>
          <p className="text-[10px] text-amber-800/40 mt-1 tracking-wide">
            © {new Date().getFullYear()} YGamify. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;

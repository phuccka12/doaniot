"use client";
import { useState, useEffect, useMemo } from "react";
import { collection, doc, onSnapshot, query, orderBy, limit, addDoc, updateDoc, setDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  Heart, Activity, AlertCircle, MapPin, LayoutDashboard, Bell, 
  Clock, Navigation, Zap, ZapOff, Phone, Download, Footprints,
  Users, Shield, Settings, Info, Search, Menu, X, ChevronRight,
  TrendingUp, BarChart3, Radio, Sun, Moon, AlertTriangle
} from "lucide-react";
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { exportWeeklyReport } from "../lib/pdfExport";

// --- CẤU HÌNH MAP ĐỘNG ---
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });
import { useMap } from "react-leaflet";

// 🔴 TẠO CHẤM ĐỎ NHẤP NHÁY
const createRedDot = () => {
  if (typeof window === 'undefined') return null;
  const L = require('leaflet');
  return L.divIcon({
    className: "custom-red-dot",
    html: `<div class="relative flex h-6 w-6">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-6 w-6 bg-rose-600 border-2 border-white shadow-lg"></span>
          </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// 🛰️ AUTO-CENTER MAP
function RecenterMap({ lat, lng }: { lat: number, lng: number }) {
  const map = (useMap as any)();
  useEffect(() => {
    if (lat && lng) {
      if (map && typeof map.flyTo === 'function') {
        map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 1.5 });
      } else {
        map.setView([lat, lng], 16);
      }
    }
  }, [lat, lng, map]);
  return null;
}

export default function PremiumAdminDashboard() {
  const [userList, setUserList] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("phuc_dev");
  const [userData, setUserData] = useState<any>(null);
  const [historyCoords, setHistoryCoords] = useState<number[][]>([]);
  const [hrHistory, setHrHistory] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<any>({ minHr: 40, maxHr: 120, minSpO2: 90 });
  const [isHudView, setIsHudView] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [now, setNow] = useState(Date.now());
  const lastSavedRef = useMemo(() => ({ ts: 0 }), []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubList = onSnapshot(collection(db, "health_monitoring"), (snapshot) => {
      setUserList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubList();
  }, []);

  useEffect(() => {
    const unsubData = onSnapshot(doc(db, "health_monitoring", selectedUserId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserData(data);
        const newPoint = { 
          time: new Date().toLocaleTimeString().slice(0, 8), 
          hr: data.hr || 0,
          spo2: data.spo2 || 0
        };
        setHrHistory(prev => [...prev.slice(-19), newPoint]);
      }
    });
    return () => unsubData();
  }, [selectedUserId]);

  useEffect(() => {
    if (!userData?.lat || !userData?.lng) return;
    const coord: number[] = [userData.lat, userData.lng];
    setHistoryCoords(prev => {
      const next = [...prev, coord];
      return next.slice(-240);
    });

    const nowTs = Date.now();
    if (nowTs - lastSavedRef.ts > 10000) {
      lastSavedRef.ts = nowTs;
      addDoc(collection(db, 'tracks', selectedUserId, 'points'), {
        lat: userData.lat, lng: userData.lng, ts: serverTimestamp()
      }).catch(console.error);
    }
  }, [userData?.lat, userData?.lng, selectedUserId]);

  useEffect(() => {
    const q = query(collection(db, 'logs'), where('userId', '==', selectedUserId), orderBy('timestamp', 'desc'), limit(30));
    return onSnapshot(q, (snap) => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [selectedUserId]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', selectedUserId), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    }, (err) => console.error(err));
    return () => unsub();
  }, [selectedUserId]);

  const checkOnline = (u: any) => u?.last_seen ? (now - u.last_seen.seconds * 1000) < 60000 : false;
  const getTimeAgo = (u: any) => {
    if (!u?.last_seen) return "Offline";
    const diff = Math.floor((now - u.last_seen.seconds * 1000) / 1000);
    return diff < 60 ? `${diff}s` : `${Math.floor(diff/60)}p`;
  };

  const emergencyActive = useMemo(() => {
    return userList.some(u => checkOnline(u) && (u.fall || u.ai_status === 'Emergency' || u.ai_status === 'CẢNH BÁO TÉ NGÃ'));
  }, [userList, now]);

  if (!userData && userList.length === 0) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent animate-pulse"></div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="z-10 flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-t-rose-500 border-slate-800 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold tracking-[0.3em] uppercase text-xs">VAA Health Hub Initializing...</p>
        </motion.div>
    </div>
  );

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'} overflow-hidden font-sans selection:bg-rose-500/30 w-full transition-colors duration-700 relative`}>
      {/* 🔥 SOS RED ALERT OVERLAY (GLOBAL) */}
      {emergencyActive && (
        <div className="absolute inset-0 z-[9999] pointer-events-none border-[20px] border-rose-600/30 animate-[pulse_1.5s_infinite]">
          <div className="absolute inset-0 bg-rose-900/10 backdrop-blur-[2px]"></div>
        </div>
      )}
      
      {/* 🔮 GLASS SIDEBAR */}
      <aside className={`w-80 ${isDarkMode ? 'bg-slate-900/50' : 'bg-white/80'} backdrop-blur-2xl border-r ${isDarkMode ? 'border-white/5' : 'border-slate-200'} flex flex-col z-30 shadow-[4px_0_24px_rgba(0,0,0,0.5)]`}>
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <Shield size={24} className="text-white drop-shadow-md"/>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">VAA ADMIN</h1>
              <p className="text-[10px] text-rose-500 font-black tracking-[0.2em] uppercase">Security Dashboard</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-rose-500 transition-colors" size={16}/>
            <input 
              type="text" 
              placeholder="Tìm kiếm thiết bị..." 
              className="w-full bg-slate-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-medium focus:outline-none focus:border-rose-500/50 focus:bg-slate-800/60 transition-all"
            />
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Thiết bị ({userList.length})</p>
            <button onClick={() => setIsHudView(!isHudView)} className={`p-2 rounded-lg transition-all ${isHudView ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              <Users size={16}/>
            </button>
          </div>
          
          <AnimatePresence mode="popLayout">
            {userList.map((user) => {
              const online = checkOnline(user);
              const isEmergency = online && (user.fall || user.ai_status === 'Emergency' || user.ai_status === 'CẢNH BÁO TÉ NGÃ');
              return (
                <motion.button
                  layout
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  key={user.id}
                  onClick={() => { setSelectedUserId(user.id); setIsHudView(false); }}
                  className={`group relative flex items-center gap-4 w-full p-4 rounded-[1.5rem] transition-all duration-500 border ${selectedUserId === user.id ? 'bg-rose-500 text-white shadow-[0_8px_32px_rgba(244,63,94,0.2)] border-rose-500' : (isDarkMode ? 'bg-transparent border-transparent hover:bg-white/5' : 'bg-transparent border-transparent hover:bg-slate-100')}`}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 ${selectedUserId === user.id ? 'bg-white/20 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>
                      {user.name?.[0] || user.id[0].toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 ${isDarkMode ? 'border-[#020617]' : 'border-white'} ${online ? (isEmergency ? 'bg-rose-500 animate-ping' : 'bg-emerald-500') : 'bg-slate-400'}`}></div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-black tracking-tight ${selectedUserId === user.id ? 'text-white' : (isDarkMode ? 'text-slate-400' : 'text-slate-700')}`}>{user.name || user.id}</div>
                    <div className={`text-[10px] ${selectedUserId === user.id ? 'text-rose-100' : 'text-slate-500'} font-bold uppercase tracking-tighter`}>
                        {online ? 'Hoạt động' : `Lần cuối: ${getTimeAgo(user)}`}
                    </div>
                  </div>
                  {isEmergency && <AlertCircle size={18} className={selectedUserId === user.id ? "text-white animate-bounce" : "text-rose-500 animate-bounce"}/>}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </nav>
      </aside>

      {/* 🚀 MAIN STAGE */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* 🚨 SOS ALERT OVERLAY */}
        <AnimatePresence>
          {emergencyActive && (
            <motion.div 
              initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
              className="absolute inset-x-0 top-0 z-[100] bg-rose-600/95 backdrop-blur-xl text-white py-5 px-10 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.4)] border-b border-rose-500/50"
            >
              <div className="flex items-center gap-6">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="p-3 bg-white text-rose-600 rounded-2xl shadow-xl">
                  <AlertCircle size={32} strokeWidth={3} />
                </motion.div>
                <div>
                  <h4 className="font-black text-2xl tracking-tighter uppercase leading-none mb-1">CẢNH BÁO TÌNH TRẠNG KHẨN CẤP</h4>
                  <p className="text-sm font-bold text-rose-100 opacity-80 uppercase tracking-widest">Phát hiện sự cố nghiêm trọng - Yêu trợ giúp ngay lập tức</p>
                </div>
              </div>
              <div className="flex gap-4">
                 <button className="bg-rose-800/50 border border-white/20 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-900 transition-colors">Bỏ qua</button>
                 <button className="bg-white text-rose-600 px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">Xử lý ngay</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP BAR */}
        <header className={`h-28 border-b ${isDarkMode ? 'border-white/5 bg-slate-950/40' : 'border-slate-200 bg-white/60'} flex items-center justify-between px-12 backdrop-blur-3xl z-20 transition-all duration-700`}>
          <div className="flex items-center gap-8">
            <AnimatePresence mode="wait">
              <motion.div key={selectedUserId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 flex items-center justify-center shadow-[0_10px_25px_rgba(244,63,94,0.3)] border border-white/20 scale-110">
                  <Users className="text-white drop-shadow-lg" size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`font-black text-3xl ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tighter`}>{userData?.name || selectedUserId}</h3>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${checkOnline(userData) ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-200 text-slate-500'}`}>
                        {checkOnline(userData) ? 'Online' : 'Offline'}
                    </div>
                  </div>
                  <div className={`flex items-center gap-4 text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>
                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-rose-500"/> {userData?.address || "Hồ Chí Minh, VN"}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12}/> {getTimeAgo(userData)}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`p-3 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-100 border-slate-200'} shadow-[0_4px_20px_rgba(0,0,0,0.1)] border rounded-2xl flex items-center gap-4 px-6 relative overflow-hidden group transition-all`}>
               <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <Phone size={18} className="text-rose-500 animate-pulse relative z-10"/>
               <div className="relative z-10">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Hotline cứu hộ</p>
                  <p className={`text-lg font-black font-mono ${isDarkMode ? 'text-rose-400' : 'text-rose-600'} leading-none`}>{userData?.phone || "0900-SOS-VAA"}</p>
               </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
              onClick={() => exportWeeklyReport(userData?.name || selectedUserId, selectedUserId, hrHistory, logs)} 
              className="flex items-center gap-3 px-6 py-4 rounded-[1.5rem] bg-sky-600/90 text-white text-sm font-black uppercase tracking-widest hover:bg-sky-600 shadow-xl transition-all border border-sky-400/30"
            >
              <Download size={18} /> BC tuần
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-white/5 text-yellow-400' : 'bg-white border-slate-200 text-slate-600'} border shadow-lg transition-all`}
            >
                {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </motion.button>

            <motion.button 
              animate={{ rotate: showSettings ? 90 : 0 }} 
              onClick={() => setShowSettings(!showSettings)} 
              className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'} border text-slate-400 hover:text-white transition-all shadow-lg`}
            >
                <Settings size={22} />
            </motion.button>
          </div>
        </header>

        {/* 📊 DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative">
          {/* 🌈 AURORA GRADIENTS */}
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-rose-500/10 blur-[150px] rounded-full -z-10 animate-pulse"></div>
          <div className="absolute bottom-[5%] left-[-5%] w-[300px] h-[300px] bg-sky-500/10 blur-[120px] rounded-full -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          <AnimatePresence mode="wait">
            {isHudView ? (
              <motion.div 
                key="hud" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                {userList.map(u => (
                  <HudCard key={u.id} user={u} isOnline={checkOnline(u)} isDarkMode={isDarkMode} onSelect={() => { setSelectedUserId(u.id); setIsHudView(false); }} />
                ))}
              </motion.div>
            ) : (
              <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                
                {/* Metric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <PremiumMetricCard icon={<Heart size={28} className="text-rose-500"/>} label="Nhịp tim" value={userData?.hr} unit="BPM" isDarkMode={isDarkMode} />
                  <PremiumMetricCard icon={<Activity size={28} className="text-sky-400"/>} label="Nồng độ SpO2" value={userData?.spo2} unit="%" isDarkMode={isDarkMode} />
                  <PremiumMetricCard icon={<Footprints size={28} className="text-emerald-400"/>} label="Hoạt động" value={userData?.steps || 0} unit="BƯỚC" isDarkMode={isDarkMode} />
                  <PremiumMetricCard 
                    icon={<Radio size={28} className={userData?.fall ? "text-rose-500 animate-pulse" : "text-emerald-500"}/>} 
                    label="Trạng thái AI" 
                    value={userData?.ai_status || "NORMAL"} 
                    isStatus 
                    alert={userData?.fall && checkOnline(userData)}
                    isDarkMode={isDarkMode}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  
                  {/* Real-time Analysis */}
                  <div className="lg:col-span-2 space-y-10">
                    <div className={`${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'} backdrop-blur-md border rounded-[3rem] p-10 shadow-3xl transition-all duration-700`}>
                        <div className="flex items-center justify-between mb-10">
                          <div>
                            <h4 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tight uppercase flex items-center gap-3`}>
                                <TrendingUp size={20} className="text-rose-500"/> Phân tích nhịp tim
                            </h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Dữ liệu thời gian thực được xử lý qua AI</p>
                          </div>
                          <div className="flex gap-2">
                             <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                             <span className="w-3 h-3 rounded-full bg-slate-800"></span>
                             <span className="w-3 h-3 rounded-full bg-slate-800"></span>
                          </div>
                        </div>
                        <div className="h-[340px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={hrHistory}>
                                    <defs>
                                      <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.5} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis domain={[40, 160]} hide />
                                    <Tooltip content={({ active, payload }) => {
                                      if (active && payload && payload.length) return (
                                        <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-3xl backdrop-blur-xl">
                                          <p className="text-[10px] text-slate-500 font-black uppercase mb-1">{payload[0].payload.time}</p>
                                          <p className="text-xl font-black text-rose-500">{payload[0].value} <span className="text-xs text-slate-400 underline">BPM</span></p>
                                        </div>
                                      );
                                      return null;
                                    }} />
                                    <Area type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={5} fillOpacity={1} fill="url(#colorHr)" animationDuration={1000} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Interactive Map */}
                    <div className={`${isDarkMode ? 'bg-slate-900' : 'bg-slate-200'} rounded-[3rem] overflow-hidden border ${isDarkMode ? 'border-white/5' : 'border-slate-200'} shadow-4xl relative h-[500px] transition-all duration-700`}>
                      <div className="absolute top-8 left-8 z-[1000] space-y-4">
                        <div className={`${isDarkMode ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-slate-200'} backdrop-blur-2xl px-6 py-4 rounded-3xl border shadow-3xl flex items-center gap-4 transition-all duration-700`}>
                          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 animate-pulse"><MapPin size={20}/></div>
                          <div>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Toạ độ vệ tinh</p>
                            <p className={`text-sm font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tighter`}>{userData?.lat?.toFixed(6)}, {userData?.lng?.toFixed(6)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-8 right-8 z-[1000]">
                         <button className={`${isDarkMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'} px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-3xl hover:opacity-90 transition-all`}>Theo dõi lộ trình</button>
                      </div>
                      
                      <MapContainer {...({ center: [userData?.lat || 10.8, userData?.lng || 106.6], zoom: 16, style: { height: '100%', width: '100%' } } as any)}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {userData?.lat && userData?.lng && (
                          <>
                            <Marker key={`marker-${userData.lat}-${userData.lng}`} position={[userData.lat, userData.lng]} icon={createRedDot() as any} />
                            
                            {/* 🌟 PREMIUM PATH TRACING (FADING TRAIL) */}
                            {historyCoords.length > 1 && historyCoords.map((coord, i) => {
                              if (i === 0) return null;
                              const prevCoord = historyCoords[i - 1];
                              const opacity = Math.max(0.1, (i / historyCoords.length) * 0.8);
                              return (
                                <Polyline 
                                  key={`poly-seg-${i}`} 
                                  positions={[prevCoord as any, coord as any]} 
                                  pathOptions={{ color: '#f43f5e', weight: 6, opacity: opacity, lineCap: 'round', lineJoin: 'round' }} 
                                />
                              );
                            })}
                            {/* 📍 STARTING POINT MARKER */}
                            {historyCoords.length > 0 && (
                              <Marker 
                                position={historyCoords[0] as any} 
                                icon={(() => {
                                  if (typeof window === 'undefined') return null;
                                  const L = require('leaflet');
                                  return L.divIcon({
                                    className: "start-point",
                                    html: `<div class="bg-sky-500 w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>`,
                                    iconSize: [16, 16],
                                    iconAnchor: [8, 8]
                                  });
                                })() as any}
                              />
                            )}
                            <RecenterMap lat={userData.lat} lng={userData.lng} />
                          </>
                        )}
                      </MapContainer>
                    </div>
                  </div>

                  {/* Right Panel: Logs & Events */}
                  <div className="space-y-10">
                    <div className={`${isDarkMode ? 'bg-slate-900/80 border-white/5' : 'bg-white border-slate-200 shadow-xl'} backdrop-blur-md border rounded-[3rem] p-10 flex flex-col h-[940px] transition-all duration-700`}>
                        <div className="flex items-center justify-between mb-8">
                          <h4 className={`flex items-center gap-3 text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tight uppercase leading-none`}>
                            <BarChart3 size={20} className="text-sky-400"/> Nhật ký cứu hộ
                          </h4>
                          <span className="text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/20 px-3 py-1 rounded-full uppercase tracking-widest">{logs.length} bản ghi</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                          {logs.length > 0 ? logs.map((log) => (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                              key={log.id} className="group p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-rose-500/30 transition-all cursor-default"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-slate-800 rounded-2xl text-slate-400 group-hover:text-rose-500 transition-colors">
                                   <AlertCircle size={20}/>
                                </div>
                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${log.status === 'Đã xử lý' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border border-rose-400/20'}`}>
                                  {log.status || 'Mới'}
                                </span>
                              </div>
                              <h5 className="text-sm font-black text-white group-hover:text-rose-400 transition-colors mb-1">{log.event || log.title || 'Phát hiện sự cố'}</h5>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mb-4 uppercase">
                                 <Clock size={12}/> {new Date((log.timestamp?.seconds || log.ts?.seconds || 0) * 1000).toLocaleString()}
                              </div>
                              {log.status !== 'Đã xử lý' && (
                                <motion.button 
                                  whileTap={{ scale: 0.95 }}
                                  onClick={async () => { 
                                    try { 
                                      await updateDoc(doc(db, 'logs', log.id), { status: 'Đã xử lý', resolvedAt: serverTimestamp() }); 
                                    } catch(e){console.error(e);} 
                                  }} 
                                  className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-colors"
                                >
                                  Xác nhận đã xử lý
                                </motion.button>
                              )}
                            </motion.div>
                          )) : (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                              <Info size={48} className="mb-4"/>
                              <p className="font-bold text-sm tracking-widest uppercase text-center px-10">Hệ thống an toàn. Chưa phát hiện sự cố.</p>
                            </div>
                          )}
                        </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ⚙️ SETTINGS PANEL OVERLAY */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className={`fixed right-10 top-32 w-96 ${isDarkMode ? 'bg-slate-900/90 border-white/10' : 'bg-white border-slate-200 shadow-2xl'} backdrop-blur-3xl border rounded-[2.5rem] p-10 z-[200] shadow-4xl overflow-hidden transition-all duration-700`}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-sky-500"></div>
              <h5 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-8 tracking-tight uppercase flex items-center gap-3`}>
                <Settings size={20} className="text-rose-500"/> Cấu hình ngưỡng
              </h5>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Nhịp tim tối thiểu</label>
                    <span className="text-xs font-black text-rose-400">{settings?.minHr} BPM</span>
                  </div>
                  <input type="range" min="30" max="100" value={settings?.minHr ?? 40} onChange={(e) => setSettings((s: any) => ({...s, minHr: Number(e.target.value)}))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Nhịp tim tối đa</label>
                    <span className="text-xs font-black text-rose-400">{settings?.maxHr} BPM</span>
                  </div>
                  <input type="range" min="100" max="220" value={settings?.maxHr ?? 120} onChange={(e) => setSettings((s: any) => ({...s, maxHr: Number(e.target.value)}))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">SpO2 cảnh báo</label>
                    <span className="text-xs font-black text-sky-400">{settings?.minSpO2}%</span>
                  </div>
                  <input type="range" min="70" max="98" value={settings?.minSpO2 ?? 90} onChange={(e) => setSettings((s: any) => ({...s, minSpO2: Number(e.target.value)}))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400" />
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowSettings(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">Huỷ</button>
                  <button 
                    onClick={async () => { 
                      try { 
                        await setDoc(doc(db, 'settings', selectedUserId), {...settings, updatedAt: serverTimestamp()}); 
                        setShowSettings(false);
                      } catch(e){console.error(e);} 
                    }} 
                    className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl bg-rose-500 text-white shadow-xl hover:bg-rose-600 transition-all hover:scale-105 active:scale-95"
                  >
                    Lưu lại
                  </button>
                </div>

                <div className="pt-6 border-t border-white/5 mt-6">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Chế độ kiểm thử (Bảo vệ Đồ án)</p>
                  <button 
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, "health_monitoring", selectedUserId), {
                          fall: true,
                          a_mag: 4.5,
                          ai_status: "Emergency",
                          ai_level: 3,
                          last_seen: serverTimestamp() // Cập nhật online để Dashboard báo đỏ
                        });
                        setShowSettings(false); // Đóng setting cho đẹp
                        setTimeout(async () => {
                          await updateDoc(doc(db, "health_monitoring", selectedUserId), { 
                            fall: false,
                            last_seen: serverTimestamp() // Giữ Online sau khi hết té
                          });
                        }, 8000);
                      } catch (err) { console.error(err); }
                    }}
                    className="w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-3 group"
                  >
                    <AlertTriangle size={16} className="group-hover:animate-bounce" /> Giả lập té ngã (SOS)
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

// --- HUD CARD COMPONENT ---
function HudCard({ user, isOnline, onSelect, isDarkMode }: any) {
  const isEmergency = isOnline && (user.fall || user.ai_status === 'Emergency' || user.ai_status === 'CẢNH BÁO TÉ NGÃ');
  
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className={`${isDarkMode ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-200'} backdrop-blur-md border ${isEmergency ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'shadow-lg'} rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 overflow-hidden relative group`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-8">
        <div className={`h-14 w-14 rounded-2xl ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'} flex items-center justify-center font-black text-xl group-hover:bg-rose-500 group-hover:text-white transition-all`}>
          {user.name?.[0] || user.id[0].toUpperCase()}
        </div>
        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isOnline ? (isEmergency ? 'bg-rose-600 animate-pulse text-white' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20') : 'bg-slate-800 text-slate-500'}`}>
           {isOnline ? (isEmergency ? 'SOS EMERGENCY' : 'ONLINE') : 'OFFLINE'}
        </div>
      </div>
      
      <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tight mb-1 group-hover:text-rose-400 transition-colors uppercase`}>{user.name || user.id}</h3>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">UID: {user.id.slice(0, 8)}...</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 ${isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50'} rounded-2xl transition-colors`}>
          <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Heart Rate</p>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user.hr || "--"}</span>
            <span className="text-[9px] text-slate-600 font-bold">BPM</span>
          </div>
        </div>
        <div className={`p-4 ${isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50'} rounded-2xl transition-colors`}>
          <p className="text-[9px] text-slate-500 font-black uppercase mb-1">SpO2</p>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user.spo2 || "--"}</span>
            <span className="text-[9px] text-slate-600 font-bold">%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- PREMIUM METRIC CARD COMPONENT ---
function PremiumMetricCard({ icon, label, value, unit, isStatus = false, alert = false, isDarkMode }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className={`relative ${isDarkMode ? 'bg-slate-900/40 backdrop-blur-3xl border-white/10' : 'bg-white border-slate-200'} border ${alert ? 'border-rose-500 bg-rose-500/5 shadow-[0_0_50px_rgba(244,63,94,0.1)]' : 'shadow-[0_8px_32px_rgba(0,0,0,0.05)]'} p-10 rounded-[3rem] transition-all duration-700 group overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${label === 'Nhịp tim' ? 'from-rose-500/20' : (label === 'Nồng độ SpO2' ? 'from-sky-500/20' : 'from-emerald-500/20')} to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      
      <div className="flex items-center justify-between mb-8">
        <div className={`p-4 rounded-[1.5rem] ${isDarkMode ? 'bg-slate-800/80 border-white/5' : 'bg-slate-50 border-slate-200'} border group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${label === 'Nhịp tim' ? 'shadow-[0_0_20px_rgba(244,63,94,0.2)]' : ''}`}>{icon}</div>
      </div>

      <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} font-black uppercase mb-3 tracking-[0.2em] transition-colors`}>{label}</p>
      
      {isStatus ? (
        <p className={`text-2xl font-black leading-none uppercase tracking-tighter ${value === 'Sensor Offline' ? 'text-amber-500' : (alert ? 'text-rose-500 animate-pulse' : 'text-emerald-500')}`}>
          {value === 'Sensor Offline' ? 'OFFLINE' : (value || 'STABLE')}
        </p>
      ) : (
        <div className="flex items-baseline gap-3">
          <span className={`text-6xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tighter drop-shadow-sm transition-colors`}>{value ?? "--"}</span>
          <span className={`${isDarkMode ? 'text-slate-600' : 'text-slate-400'} font-black text-sm uppercase tracking-widest transition-colors`}>{unit}</span>
        </div>
      )}
    </motion.div>
  );
}
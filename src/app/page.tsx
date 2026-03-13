"use client";
import { useState, useEffect, useMemo } from "react";
import { collection, doc, onSnapshot, query, orderBy, limit, addDoc, updateDoc, setDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Heart, Activity, AlertCircle, MapPin, LayoutDashboard, Bell, Clock, Navigation, Zap, ZapOff, Phone, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  // require leaflet only on client to avoid SSR window errors
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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
      // Smoothly animate the map to the new location instead of snapping
      if (map && typeof map.flyTo === 'function') {
        map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 1.5 });
      } else {
        map.setView([lat, lng], 16);
      }
    }
  }, [lat, lng, map]);
  return null;
}

export default function RealAdminDashboard() {
  const [userList, setUserList] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("phuc_dev");
  const [userData, setUserData] = useState<any>(null);
  const [historyCoords, setHistoryCoords] = useState<number[][]>([]);
  const [hrHistory, setHrHistory] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<any>({ minHr: 40, maxHr: 120, minSpO2: 90 });
  const lastSavedRef = useMemo(() => ({ ts: 0 }), []);
  const [now, setNow] = useState(Date.now());

  // 1. Đồng hồ đếm giây để check Online/Offline
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Lấy danh sách thiết bị
  useEffect(() => {
    const unsubList = onSnapshot(collection(db, "health_monitoring"), (snapshot) => {
      setUserList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubList();
  }, []);

  // 3. Lấy dữ liệu Real-time & Cập nhật biểu đồ
  useEffect(() => {
    const unsubData = onSnapshot(doc(db, "health_monitoring", selectedUserId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserData(data);
        
        // Cập nhật biểu đồ (giữ 15 điểm gần nhất)
        const newPoint = { 
          time: new Date().toLocaleTimeString().slice(0, 8), 
          hr: data.hr || 0 
        };
        setHrHistory(prev => [...prev.slice(-14), newPoint]);
      }
    });
    return () => unsubData();
  }, [selectedUserId]);

  // 4. Track route locally and persist points to Firestore (throttled)
  useEffect(() => {
    if (!userData?.lat || !userData?.lng) return;
    const coord: number[] = [userData.lat, userData.lng];

    setHistoryCoords(prev => {
      const next = [...prev, coord];
      return next.slice(-240); // keep last 240 points
    });

    // Throttle writes to Firestore: one write per 5 seconds
    const nowTs = Date.now();
    if (nowTs - lastSavedRef.ts > 5000) {
      lastSavedRef.ts = nowTs;
      (async () => {
        try {
          await addDoc(collection(db, 'tracks', selectedUserId, 'points'), {
            lat: userData.lat,
            lng: userData.lng,
            ts: serverTimestamp()
          });
        } catch (e) {
          console.error('Failed to save track point', e);
        }
      })();
    }
  }, [userData?.lat, userData?.lng, selectedUserId, userData, lastSavedRef]);

  // 5. Load recent logs for selected user
  useEffect(() => {
    const q = query(collection(db, 'logs'), where('userId', '==', selectedUserId), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedUserId]);

  // 6. Load settings for selected user (if exists)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', selectedUserId), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    }, (err) => {
      // ignore
    });
    return () => unsub();
  }, [selectedUserId]);

  // --- HELPERS ---
  const checkOnline = (u: any) => {
    if (!u?.last_seen) return false;
    return (now - u.last_seen.seconds * 1000) < 30000; // < 30s là online
  };

  const getTimeAgo = (u: any) => {
    if (!u?.last_seen) return "N/A";
    const diff = Math.floor((now - u.last_seen.seconds * 1000) / 1000);
    return diff < 60 ? `${diff}s trước` : `${Math.floor(diff/60)}p trước`;
  };

  if (!userData) return <div className="h-screen bg-slate-950 flex items-center justify-center text-rose-500 font-mono animate-pulse text-2xl">INITIALIZING FULL-STACK SYSTEM...</div>;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-rose-500/10 rounded-lg"><Zap size={18} className="text-rose-500"/></div>
            <h2 className="text-xl font-black tracking-tighter uppercase">VAA Admin</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] pl-1">SAFETY IOT ECOSYSTEM</p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-3">
          <p className="text-[10px] text-slate-600 font-black px-2 uppercase">Thiết bị đang chạy ({userList.length})</p>
          {userList.map((user) => {
            const online = checkOnline(user);
            return (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`flex items-center gap-3 w-full p-4 rounded-2xl transition-all duration-300 border ${selectedUserId === user.id ? 'bg-rose-500/10 border-rose-500/50 shadow-lg' : 'bg-slate-800/40 border-transparent hover:border-slate-700'}`}
              >
                <div className={`w-3 h-3 rounded-full ${online ? (user.fall ? 'bg-rose-500 animate-ping' : 'bg-emerald-500') : 'bg-slate-600'}`}></div>
                <div className="flex-1 text-left">
                  <div className={`text-sm font-bold ${selectedUserId === user.id ? 'text-white' : 'text-slate-400'}`}>{user.name || user.id}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{online ? 'Đang hoạt động' : `Lần cuối: ${getTimeAgo(user)}`}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* 🚨 SOS ALERT OVERLAY */}
        {userData.fall && checkOnline(userData) && (
          <div className="absolute inset-x-0 top-0 z-[100] bg-rose-600 text-white py-4 px-8 flex items-center justify-between animate-pulse shadow-2xl border-b-4 border-rose-800">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-full animate-bounce"><AlertCircle size={28} /></div>
              <div>
                <h4 className="font-black text-xl tracking-tight">CẢNH BÁO TÉ NGÃ KHẨN CẤP!</h4>
                <p className="text-xs text-rose-100 font-bold">Vị trí đã được xác định - Hãy cứu hộ ngay lập tức</p>
              </div>
            </div>
            <a 
              href={`https://www.google.com/maps?q=${userData.lat},${userData.lng}`}
              target="_blank"
              className="bg-white text-rose-600 px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Navigation size={18} /> GOOGLE MAPS
            </a>
          </div>
        )}

        {/* HEADER */}
        <header className="h-24 border-b border-slate-800 flex items-center justify-between px-10 bg-slate-950/60 backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700">
                <LayoutDashboard className="text-rose-500" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-2xl text-white tracking-tight">{userData.name}</h3>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${checkOnline(userData) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                    {checkOnline(userData) ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">UID: {selectedUserId} • Cập nhật: {getTimeAgo(userData)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Liên hệ khẩn cấp</p>
              <div className="flex items-center gap-2 text-rose-500">
                <Phone size={16} />
                <p className="text-xl font-black font-mono">{userData.phone}</p>
              </div>
            </div>
            <button onClick={() => exportWeeklyReport(userData.name, selectedUserId, hrHistory, logs)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 transition-colors">
              <Download size={16} /> Xuất báo cáo
            </button>
            <div className="relative cursor-pointer hover:scale-110 transition-transform">
                <Bell size={24} className={userData.fall ? "text-rose-500 animate-shake" : "text-slate-600"} />
                {userData.fall && <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-950"></span>}
            </div>
          </div>
        </header>

        {/* Settings overlay */}
        {showSettings && (
          <div className="fixed right-8 top-28 w-80 bg-slate-900 border border-slate-800 rounded-lg p-4 z-50 shadow-2xl">
            <h5 className="text-sm font-bold text-slate-200 mb-2">Device thresholds ({selectedUserId})</h5>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Min HR</label>
              <input type="number" value={settings?.minHr ?? ''} onChange={(e) => setSettings((s: any) => ({...s, minHr: Number(e.target.value)}))} className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm" />
              <label className="text-xs text-slate-400">Max HR</label>
              <input type="number" value={settings?.maxHr ?? ''} onChange={(e) => setSettings((s: any) => ({...s, maxHr: Number(e.target.value)}))} className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm" />
              <label className="text-xs text-slate-400">Min SpO2</label>
              <input type="number" value={settings?.minSpO2 ?? ''} onChange={(e) => setSettings((s: any) => ({...s, minSpO2: Number(e.target.value)}))} className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm" />
              <div className="flex justify-between mt-3">
                <button onClick={() => setShowSettings(false)} className="px-3 py-1 text-sm rounded bg-slate-800 border border-slate-700">Close</button>
                <button onClick={async () => { try { await setDoc(doc(db, 'settings', selectedUserId), {...settings, updatedAt: serverTimestamp()}); setShowSettings(false);} catch(e){console.error(e);} }} className="px-3 py-1 text-sm rounded bg-rose-500 text-white">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD GRID */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/40 via-transparent to-transparent">
          
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricCard icon={<Heart className="text-rose-500"/>} label="Nhịp tim" value={userData.hr} unit="BPM" chartData={hrHistory} color="#f43f5e" />
            <MetricCard icon={<Activity className="text-sky-400"/>} label="Nồng độ SpO2" value={userData.spo2} unit="%" color="#38bdf8" />
            <MetricCard 
              icon={<AlertCircle className={userData.fall ? "text-rose-500" : "text-emerald-500"}/>} 
              label="Trạng thái AI" 
              value={userData.ai_status} 
              isStatus 
              alert={userData.fall && checkOnline(userData)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Real-time Heart Rate Chart */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-sm">
                <h4 className="text-xs font-black text-slate-500 mb-8 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock size={16} className="text-rose-500"/> BIỂU ĐỒ NHỊP TIM THEO THỜI GIAN THỰC
                </h4>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hrHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={[40, 160]} hide />
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '12px'}} />
                            <Line type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={4} dot={{r: 4, fill: '#f43f5e'}} animationDuration={300} isAnimationActive={true} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Map Section */}
            <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl relative h-[450px]">
              <div className="absolute top-6 left-6 z-[1000] bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-700 text-[10px] font-bold font-mono shadow-2xl backdrop-blur-md">
                <MapPin size={12} className="inline mr-2 text-rose-500 animate-bounce"/>
                <span className="text-slate-300">{userData.lat?.toFixed(6)}, {userData.lng?.toFixed(6)}</span>
              </div>
              
              <MapContainer {...({ center: [userData.lat || 10.8, userData.lng || 106.6], zoom: 16, style: { height: '100%', width: '100%' } } as any)}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {userData.lat && userData.lng && (
                  <>
                    <Marker key={`marker-${userData.lat}-${userData.lng}`} position={[userData.lat, userData.lng]} icon={createRedDot() as any} />
                    {historyCoords.length > 1 && (
                      <Polyline key={`poly-${historyCoords.length}-${userData.lat}-${userData.lng}`} positions={historyCoords as any} pathOptions={{ color: '#38bdf8', weight: 4, opacity: 0.85 }} />
                    )}
                    <RecenterMap lat={userData.lat} lng={userData.lng} />
                  </>
                )}
              </MapContainer>
            </div>

            {/* Recent Logs / Incident panel */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-6 overflow-y-auto">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest"><Clock size={16}/> Nhật ký cứu hộ</h4>
                <div className="space-y-3">
                  {logs.length > 0 ? logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-md border border-slate-700">
                      <div>
                        <p className="text-sm font-medium">{log.event || log.title || 'Sự kiện'}</p>
                        <p className="text-[11px] text-slate-500">{new Date((log.timestamp?.seconds || log.ts?.seconds || 0) * 1000).toLocaleString()}</p>
                        <p className="text-[11px] text-slate-400">{log.location || ''}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded ${log.status === 'Đã xử lý' ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>{log.status || 'Mới'}</span>
                        {log.status !== 'Đã xử lý' && (
                          <button onClick={async () => { try { await updateDoc(doc(db, 'logs', log.id), { status: 'Đã xử lý', resolvedAt: serverTimestamp() }); } catch(e){console.error(e);} }} className="text-xs px-2 py-1 rounded bg-emerald-500 text-white">Xác nhận đã cứu hộ</button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-slate-500 italic text-sm text-center py-10">Chưa có bản ghi sự cố nào.</p>
                  )}
                </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// --- COMPONENT THẺ CHỈ SỐ ---
function MetricCard({ icon, label, value, unit, isStatus = false, alert = false }: any) {
  return (
    <div className={`bg-slate-900/60 border ${alert ? 'border-rose-500 bg-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-slate-800'} p-8 rounded-[2.5rem] transition-all duration-500 group`}>
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-2xl bg-slate-800 group-hover:scale-110 transition-transform`}>{icon}</div>
        {alert && <div className="text-[9px] font-black bg-rose-600 text-white px-3 py-1 rounded-full animate-pulse tracking-tighter">SOS ACTIVE</div>}
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-[0.1em]">{label}</p>
        {isStatus ? (
          <p className={`text-2xl font-black leading-none ${alert ? 'text-rose-500' : 'text-emerald-500'}`}>{value || 'STABLE'}</p>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white tracking-tighter">{value ?? '--'}</span>
            <span className="text-slate-600 font-bold text-sm uppercase">{unit}</span>
          </div>
        )}
      </div>
    </div>
  );
}
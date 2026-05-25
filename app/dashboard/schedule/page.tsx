"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Spinner } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string) => fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r=>r.ok?r.json():[]);

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

const SHIFTS = [
  { label:"Morning",   start:"08:00", end:"14:00", color:"bg-blue-100 text-blue-700"   },
  { label:"Afternoon", start:"14:00", end:"18:00", color:"bg-amber-100 text-amber-700" },
  { label:"Full day",  start:"08:00", end:"18:00", color:"bg-green-100 text-green-700" },
  { label:"Day off",   start:"",      end:"",       color:"bg-gray-100 text-gray-500"   },
];

export default function SchedulePage() {
  const [techs,    setTechs]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [schedule, setSchedule] = useState<Record<string,Record<string,string>>>({});

  useEffect(() => {
    af("/api/users?role=TECHNICIAN").then(d => {
      const u = Array.isArray(d)?d:[];
      setTechs(u);
      const init: Record<string,Record<string,string>> = {};
      u.forEach((t:any) => {
        init[t.id] = {};
        DAYS.forEach(d => { init[t.id][d] = "Full day"; });
      });
      setSchedule(init);
      setLoading(false);
    });
  }, []);

  function setShift(techId: string, day: string, shift: string) {
    setSchedule(prev => ({ ...prev, [techId]: { ...prev[techId], [day]: shift } }));
  }

  return (
    <div className="fade-up">
      <PageHeader title="Staff Schedule" subtitle="Weekly shifts for technicians" />

      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div> : (
        <Card className="p-0 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-ink-paper">
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-faint uppercase tracking-wide w-40">Technician</th>
                {DAYS.map(d=><th key={d} className="text-center px-3 py-3 text-xs font-semibold text-ink-faint uppercase tracking-wide">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {techs.map(tech=>(
                <tr key={tech.id} className="border-t border-ink-ghost">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                        {tech.name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{tech.name}</p>
                        <p className="text-[10px] text-ink-faint">{tech.workshop?.name||"—"}</p>
                      </div>
                    </div>
                  </td>
                  {DAYS.map(day=>{
                    const shift = schedule[tech.id]?.[day]||"Full day";
                    const shiftData = SHIFTS.find(s=>s.label===shift)||SHIFTS[2];
                    return (
                      <td key={day} className="px-2 py-3 text-center">
                        <select value={shift} onChange={e=>setShift(tech.id,day,e.target.value)}
                          className={clsx("rounded-lg px-2 py-1 text-[11px] font-semibold border-0 cursor-pointer", shiftData.color)}>
                          {SHIFTS.map(s=><option key={s.label} value={s.label}>{s.label}</option>)}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {techs.length===0 && <tr><td colSpan={8} className="py-12 text-center text-ink-faint text-sm">No technicians found</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      <div className="flex gap-3 mt-4 flex-wrap">
        {SHIFTS.map(s=>(
          <div key={s.label} className={clsx("rounded-lg px-3 py-1.5 text-xs font-semibold", s.color)}>
            {s.label}{s.start?` (${s.start}–${s.end})`:""}
          </div>
        ))}
      </div>
    </div>
  );
}

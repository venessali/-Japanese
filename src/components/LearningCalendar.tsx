import React, { useState } from 'react';
import { LearningLog } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface LearningCalendarProps {
  logs: LearningLog[];
}

export function LearningCalendar({ logs }: LearningCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "yyyy年MM月";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getDayLogs = (day: Date) => {
    return logs.filter(log => log.date === format(day, 'yyyy-MM-dd'));
  };

  const getDayIntensity = (day: Date) => {
    const dayLogs = getDayLogs(day);
    if (dayLogs.length === 0) return 0;
    
    // Calculate total activity
    const totalActivity = dayLogs.reduce((acc, log) => acc + log.vocabLearned + log.grammarLearned + log.quizzesTaken * 5, 0);
    
    if (totalActivity > 20) return 3; // High intensity
    if (totalActivity > 10) return 2; // Medium intensity
    return 1; // Low intensity
  };

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-emerald-100 p-3 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="text-emerald-500" size={18} />
          <h2 className="text-base font-black text-emerald-800">学习日历</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-0.5 hover:bg-emerald-50 rounded text-emerald-600 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="font-bold text-gray-700 text-xs min-w-[70px] text-center">
            {format(currentDate, dateFormat)}
          </span>
          <button onClick={nextMonth} className="p-0.5 hover:bg-emerald-50 rounded text-emerald-600 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mx-auto">
        {days.map((day, i) => {
          const intensity = getDayIntensity(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toString()}
              className={`
                relative flex flex-col items-center justify-center p-0.5 rounded-lg h-8 w-8 transition-all
                ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}
                ${isTodayDate ? 'border border-emerald-400 font-black' : 'border border-transparent font-medium'}
                ${intensity === 0 ? 'bg-gray-50 text-gray-500 hover:bg-gray-100' : ''}
                ${intensity === 1 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : ''}
                ${intensity === 2 ? 'bg-emerald-300 text-emerald-800 hover:bg-emerald-400' : ''}
                ${intensity === 3 ? 'bg-emerald-500 text-white hover:bg-emerald-600' : ''}
              `}
              title={intensity > 0 ? `学习了 ${getDayLogs(day).reduce((acc, log) => acc + log.vocabLearned + log.grammarLearned + log.quizzesTaken * 5, 0)} 项内容` : '未学习'}
            >
              <span className="text-[10px]">{format(day, 'd')}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5 text-[9px] font-bold text-gray-500">
        <span>少</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-gray-50 border border-gray-200"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-100"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-300"></div>
        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
        <span>多</span>
      </div>
    </div>
  );
}

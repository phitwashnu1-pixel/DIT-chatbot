"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { Send, MessageCircle, Calendar, CalendarDays, Search, User, ClipboardList, HelpCircle, Loader2, PlusCircle, RefreshCw } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Quick Actions
const QUICK_ACTIONS = [
  {
    icon: <Calendar className="w-5 h-5 text-purple-600" />,
    title: "ตารางเรียน",
    subtitle: "ดูตารางเรียนของแต่ละกลุ่มเรียน",
    query: "ขอตารางเรียนหน่อยครับ",
    color: "bg-purple-100/50 text-purple-600"
  },
  {
    icon: <CalendarDays className="w-5 h-5 text-green-600" />,
    title: "ตารางการใช้ห้อง",
    subtitle: "ดูตารางห้องว่างเพื่อใช้ห้อง ทั้งหมด",
    query: "ห้อง 442 วันนี้ว่างไหม",
    color: "bg-green-100/50 text-green-600"
  },
  {
    icon: <User className="w-5 h-5 text-orange-600" />,
    title: "ตารางสอนครู",
    subtitle: "ดูตารางสอนของครู แต่ละรายวิชา",
    query: "ครูกนกวรรณสอนวันไหนบ้าง",
    color: "bg-orange-100/50 text-orange-600"
  },
  {
    icon: <HelpCircle className="w-5 h-5 text-cyan-600" />,
    title: "วิธีการใช้งาน",
    subtitle: "แนะนำวิธีการใช้งาน ระบบต่างๆ",
    query: "ระบบนี้ทำอะไรได้บ้าง",
    color: "bg-cyan-100/50 text-cyan-600"
  }
];

export default function Chat() {
  const { messages, setMessages, input, handleInputChange, handleSubmit, isLoading, append, error } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleQuickAction = (query: string) => {
    append({ role: 'user', content: query });
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden relative bg-[#f8f9fa]">
      
      {/* Blurred Background Image - Fixed to cover entire screen flawlessly */}
      <div className="absolute inset-0 z-0 bg-[#f8f9fa] overflow-hidden">
        <Image src="/background.jpg" alt="Background" fill className="object-cover blur-[15px] scale-[1.15] opacity-70" priority />
        <div className="absolute inset-0 bg-white/50"></div>
      </div>


      {/* Sidebar - Blue to Yellow Gradient */}
      <aside className="w-[80px] bg-gradient-to-b from-[#0c3166] via-[#10438a] to-[#e5a913] flex flex-col items-center justify-between py-8 hidden md:flex shrink-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.1)] relative">
        <div></div>
        <div className="text-white text-center flex flex-col items-center">
          <div className="flex flex-col items-center justify-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
             <div className="w-10 h-10 mb-1 relative text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
             </div>
             <span className="text-[10px] font-bold tracking-widest mt-1">DBIT</span>
             <span className="text-[8px] font-medium tracking-wider mt-0.5 opacity-80 uppercase">Dept</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full h-full min-w-0 z-10">
         
         {/* Header */}
         <header className="w-full flex items-center justify-between px-4 md:px-10 py-4 md:py-6 bg-transparent z-40 shrink-0 relative">
           <div className="flex items-center min-w-0">
             <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 bg-white rounded-full shadow-md flex items-center justify-center p-1 border-2 border-white/80">
               <Image src="/logosvc.png" width={52} height={52} alt="Logo" className="object-contain w-10 h-10 md:w-12 md:h-12" />
             </div>
             <div className="ml-3 md:ml-5 min-w-0 pr-2">
               <h1 className="text-lg md:text-[22px] font-extrabold text-[#0c3166] tracking-tight truncate">แชทบอทบริการข้อมูล</h1>
               <p className="text-[11px] md:text-sm text-[#0c3166]/80 font-semibold mt-0.5 leading-tight line-clamp-2 md:line-clamp-1">แผนกธุรกิจดิจิทัลและเทคโนโลยีสารสนเทศ วิทยาลัยอาชีวศึกษาสุราษฎร์ธานี</p>
             </div>
           </div>
           
           {/* New Chat Button & Profile Image */}
           <div className="flex items-center shrink-0">
             {messages.length > 0 && (
               <button
                 onClick={handleNewChat}
                 className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-white/90 hover:bg-white border border-gray-200 shadow-sm rounded-full text-xs font-bold text-[#0c3166] transition-all hover:scale-105 active:scale-95"
                 title="เริ่มแชทใหม่"
               >
                 <RefreshCw className="w-4 h-4" />
                 <span className="hidden sm:inline">เริ่มแชทใหม่</span>
               </button>
             )}
           </div>
         </header>

         {/* Chat Scrollable Area - Full Width without Inner Box */}
         <div className="flex-1 overflow-y-auto px-4 md:px-8 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex flex-col items-center w-full">
             
             <div className="w-full max-w-4xl flex flex-col justify-start h-full pb-10 pt-4 md:pt-10">
               {messages.length === 0 ? (
                 <div className="w-full flex flex-col animate-[fadeIn_0.5s_ease-out]">
                   
                   {/* Welcome Hero Content */}
                   <div className="flex flex-col md:flex-row items-center justify-center mb-16 mt-8">
                     <div className="relative mb-6 md:mb-0 shrink-0">
                       <div className="w-40 h-40 md:w-52 md:h-52 relative">
                         <Image 
                           src="/logochatbot_transparent.png" 
                           alt="Bot" 
                           fill
                           className="object-contain drop-shadow-2xl rounded-[2.5rem]" 
                         />
                       </div>
                     </div>
                     <div className="md:ml-12 text-center md:text-left flex flex-col justify-center max-w-lg">
                       <h2 className="text-3xl md:text-4xl font-extrabold text-[#0c3166] mb-4 drop-shadow-sm">สวัสดีครับ! 👋</h2>
                       <p className="text-gray-700 leading-relaxed text-base md:text-lg font-medium mt-2">
                         ผมคือ แชทบอทสำหรับให้บริการข้อมูลตารางเรียน ตารางสอน <br className="hidden md:block"/>
                         และตารางการใช้ห้องของแผนกธุรกิจดิจิทัลและเทคโนโลยีสารสนเทศ <br className="hidden md:block"/>
                         วิทยาลัยอาชีวศึกษาสุราษฎร์ธานี
                       </p>
                     </div>
                   </div>

                   {/* Quick Actions */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 w-full max-w-3xl mx-auto">
                     {QUICK_ACTIONS.map((action, idx) => (
                       <button
                         key={idx}
                         onClick={() => handleQuickAction(action.query)}
                         className="flex items-center p-4 bg-white/80 backdrop-blur-md border border-white rounded-[1.5rem] hover:bg-white hover:shadow-[0_8px_30px_rgb(12,49,102,0.12)] hover:-translate-y-1 transition-all duration-300 text-left group"
                       >
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${action.color} mr-4 group-hover:scale-110 transition-transform duration-300`}>
                           {action.icon}
                         </div>
                         <div className="flex-1">
                           <div className="font-bold text-gray-800 text-sm md:text-base mb-1 group-hover:text-[#0c3166] transition-colors">{action.title}</div>
                           <div className="text-xs text-gray-500 font-medium line-clamp-1">{action.subtitle}</div>
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div className="space-y-8 w-full pb-10">
                    {/* Actual Chat Messages */}
                    {messages.map((m, index) => (
                      <div
                        key={m.id}
                        className={`flex w-full ${
                          m.role === "user" ? "justify-end" : "justify-start"
                        } animate-[slideUp_0.3s_ease-out_forwards]`}
                      >
                        {m.role === "user" ? (
                           <div className="bg-gradient-to-r from-[#0c3166] to-[#0a2347] text-white px-6 py-4 rounded-3xl rounded-tr-sm shadow-md max-w-[90%] sm:max-w-[75%] leading-relaxed break-words relative z-20 overflow-hidden min-w-0">
                             <div className="prose max-w-none text-white prose-p:text-white prose-strong:text-white font-medium w-full">
                               <ReactMarkdown 
                                 remarkPlugins={[remarkGfm]}
                                 components={{
                                   table: ({node, ...props}) => (
                                     <div className="w-full overflow-x-auto pb-2 my-2 scrollbar-thin scrollbar-thumb-white/50 scrollbar-track-transparent">
                                       <table {...props} className="min-w-full whitespace-nowrap" />
                                     </div>
                                   )
                                 }}
                               >
                                 {m.content}
                               </ReactMarkdown>
                             </div>
                           </div>
                        ) : (
                           <div className="flex items-start space-x-4 max-w-[95%] sm:max-w-[85%]">
                             <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0 bg-white shadow-sm flex items-center justify-center border border-gray-100 mt-1">
                               <Image src="/logochatbot_transparent.png" alt="Bot Avatar" width={40} height={40} className="object-cover rounded-full" />
                             </div>
                             <div className="flex flex-col space-y-1 flex-1 min-w-0">
                               <span className="text-sm font-bold text-[#0c3166] ml-1 shrink-0">DIT Bot</span>
                               <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-6 py-5 rounded-3xl rounded-tl-sm shadow-sm border border-white leading-relaxed break-words overflow-hidden w-full">
                                 <div className="prose max-w-none w-full font-medium text-gray-700">
                                   <ReactMarkdown 
                                     remarkPlugins={[remarkGfm]}
                                     components={{
                                       table: ({node, ...props}) => (
                                         <div className="w-full overflow-x-auto pb-2 my-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                                           <table {...props} className="min-w-full whitespace-nowrap" />
                                         </div>
                                       )
                                     }}
                                   >
                                     {m.content}
                                   </ReactMarkdown>
                                 </div>
                               </div>
                             </div>
                           </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Loading Indicator */}
                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                       <div className="flex items-start space-x-4 w-full justify-start animate-[fadeIn_0.3s_ease-out]">
                         <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white shadow-sm flex items-center justify-center border border-gray-100 mt-1">
                           <Image src="/logochatbot_transparent.png" alt="Bot Avatar" width={40} height={40} className="object-cover rounded-full" />
                         </div>
                         <div className="flex flex-col space-y-1">
                           <span className="text-sm font-bold text-[#0c3166] ml-1">DIT Bot</span>
                           <div className="bg-white/90 px-6 py-5 rounded-3xl rounded-tl-sm shadow-sm border border-white flex items-center space-x-2">
                             <span className="w-2 h-2 bg-[#0c3166]/60 rounded-full animate-bounce [animation-delay:-0.32s]"></span>
                             <span className="w-2 h-2 bg-[#0c3166]/60 rounded-full animate-bounce [animation-delay:-0.16s]"></span>
                             <span className="w-2 h-2 bg-[#0c3166]/60 rounded-full animate-bounce"></span>
                           </div>
                         </div>
                       </div>
                    )}
                    
                    {/* Error Indicator */}
                    {error && (
                       <div className="flex w-full justify-start animate-[fadeIn_0.3s_ease-out_forwards]">
                         <div className="flex items-start space-x-4 max-w-[95%] sm:max-w-[85%]">
                           <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white shadow-sm flex items-center justify-center border border-red-100 mt-1">
                             <span className="text-xl">⚠️</span>
                           </div>
                           <div className="flex flex-col space-y-1 w-full">
                             <span className="text-sm font-bold text-red-600 ml-1">System Notice</span>
                             <div className="bg-red-50/90 backdrop-blur-sm text-red-800 px-6 py-4 rounded-3xl rounded-tl-sm shadow-sm border border-red-100 font-medium">
                               {error.message.includes("API") || error.message.includes("429") || error.message.includes("Too Many") ? "ขณะนี้มีผู้ใช้งานจำนวนมาก (API Limit Reached) กรุณาลองใหม่อีกครั้งในอีกสักครู่ครับ 🙏" : "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้งครับ"}
                             </div>
                           </div>
                         </div>
                       </div>
                    )}
                    
                    <div ref={messagesEndRef} className="h-4" />
                 </div>
               )}
             </div>
         </div>

         {/* Input Area - Gemini Style (Bottom Center) */}
         <div className="shrink-0 w-full px-4 md:px-8 py-4 pb-6 md:pb-8 z-40 flex flex-col items-center">
            <form onSubmit={handleSubmit} className="w-full max-w-3xl relative flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[2rem] bg-white/95 backdrop-blur-xl border border-gray-100 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100/50 transition-all duration-300">
               <div className="pl-4 py-2 shrink-0">
                 <div className="p-3 text-[#0c3166]/60 bg-blue-50/50 rounded-full flex items-center justify-center">
                   <MessageCircle className="w-5 h-5" />
                 </div>
               </div>
               <input
                 className="flex-1 bg-transparent border-none px-4 py-5 focus:outline-none text-gray-800 placeholder-gray-400 text-base font-medium"
                 value={input}
                 placeholder="พิมพ์คำถามตรงนี้ได้เลยครับ"
                 onChange={handleInputChange}
                 disabled={isLoading}
               />
               <div className="pr-3 py-2 shrink-0">
                 <button
                   type="submit"
                   disabled={isLoading || !input.trim()}
                   className="p-3.5 bg-gradient-to-r from-[#0c3166] to-[#0a2347] hover:opacity-90 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-full transition-all shadow-md focus:outline-none transform hover:scale-105 active:scale-95 flex items-center justify-center"
                 >
                   {isLoading ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                   ) : (
                     <Send className="w-5 h-5 ml-0.5" />
                   )}
                 </button>
               </div>
            </form>
            
            <div className="flex justify-center w-full mt-4 px-2">
               <span className="text-[10px] md:text-xs text-gray-500 font-medium flex items-start md:items-center bg-white/50 px-3 py-1.5 rounded-2xl md:rounded-full backdrop-blur-md border border-white shadow-sm text-left md:text-center leading-tight">
                 <span className="w-3.5 h-3.5 border border-gray-400 rounded-full flex items-center justify-center mr-1.5 opacity-80 shrink-0 mt-0.5 md:mt-0">
                   <span className="text-[8px] font-bold">i</span>
                 </span>
                 <span>หมายเหตุ: ข้อมูลอ้างอิงจากตารางปัจจุบัน อาจมีการเปลี่ยนแปลง กรุณาตรวจสอบกับทางวิทยาลัยอีกครั้ง</span>
               </span>
            </div>
         </div>
      </main>
    </div>
  );
}

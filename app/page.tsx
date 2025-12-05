import Hero from '@/components/Hero';
import MissionVision from '@/components/MissionVision';
import Values from '@/components/Values';
import BoardMembers from '@/components/BoardMembers';
import OurWork from '@/components/OurWork';
import Partners from '@/components/Partners';
import Donate from '@/components/Donate';
import MeetFounder from '@/components/MeetFounder';
import AnnualSummit from '@/components/AnnualSummit';

export default function Home() {
  return (
    <div className="relative z-10">
      <Hero />
      <MissionVision />
      <Values />
      <MeetFounder />
      <BoardMembers />
      <OurWork />
      <Partners />
      <AnnualSummit />
      <Donate />
    </div>
  );
}


// src/pages/Home.tsx
import '../styles/Home.css';

import HeroSection    from '../components/home/HeroSection';
import MissionSection from '../components/home/MissionSection';
import HealingSteps   from '../components/home/HealingSteps';
import ImpactSection  from '../components/home/ImpactSection';
import CtaBanner      from '../components/home/CtaBanner';
import Footer         from '../components/layout/Footer';

export default function Home() {
  return (
    <>
      <HeroSection />
<MissionSection />
      <HealingSteps />
      <ImpactSection />
      <CtaBanner />
      <Footer variant="default" />
    </>
  );
}

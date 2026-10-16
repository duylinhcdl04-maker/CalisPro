import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Hero from "../../components/sections/Hero";
import FeatureStrip from "../../components/sections/FeatureStrip";
import HowItWorks from "../../components/sections/HowItWorks";
import ValueProps from "../../components/sections/ValueProps";
import EvidenceSection from "../../components/sections/EvidenceSection";
import SkillRoadmap from "../../components/sections/SkillRoadmap";
import FinalCTA from "../../components/sections/FinalCTA";

export default function PublicHomePage() {
  return (
    <div className="bg-[#0a0712] text-white">
      <Navbar />
      <Hero />
      <FeatureStrip />
      <HowItWorks />
      <ValueProps />
      <EvidenceSection />
      <SkillRoadmap />
      <FinalCTA />
      <Footer />
    </div>
  );
}

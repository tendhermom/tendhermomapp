import { useState } from "react";
import TabBar from "@/components/navigation/TabBar";
import HomeScreen from "@/screens/HomeScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import SOSScreen from "@/screens/SOSScreen";
import ConsultScreen from "@/screens/ConsultScreen";
import RecordsScreen from "@/screens/RecordsScreen";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen onNavigate={setActiveTab} />;
      case "community":
        return <CommunityScreen />;
      case "sos":
        return <SOSScreen />;
      case "consult":
        return <ConsultScreen />;
      case "records":
        return <RecordsScreen />;
      default:
        return <HomeScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-5 pt-12 pb-28">
        {renderScreen()}
      </div>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;

import { Building2, Menu, Bell, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainHeaderProps {
  onRightMenuOpen: () => void;
  onLeftMenuOpen: () => void;
  onNotificationsOpen?: () => void;
}

const MainHeader = ({ onRightMenuOpen, onLeftMenuOpen, onNotificationsOpen }: MainHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-wasata-green via-wasata-green-dark to-wasata-green backdrop-blur-md border-b-2 border-wasata-gold shadow-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Right: Burger Menu */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onRightMenuOpen}
              className="border-2 border-wasata-gold hover:bg-white/20 bg-white/10 text-white h-9 w-9"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>

          {/* Center: Logo */}
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full shadow-lg border-2 border-wasata-gold backdrop-blur-sm">
              <Building2 className="w-5 h-5" />
              <span className="font-bold">عقاري</span>
              <span className="font-bold text-wasata-gold">AI</span>
              <span className="font-bold">Aqari</span>
            </div>
          </div>

          {/* Left: Icons */}
          <div className="flex items-center gap-2">
            {/* Left Sidebar Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={onLeftMenuOpen}
              className="border-2 border-wasata-gold hover:bg-white/20 bg-white/10 text-white h-9 w-9"
            >
              <PanelLeft className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <Button
              variant="outline"
              size="icon"
              onClick={onNotificationsOpen}
              className="border-2 border-wasata-gold hover:bg-white/20 bg-white/10 text-white relative h-9 w-9"
            >
              <Bell className="w-5 h-5" />
              {/* Notification Badge */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;

import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-5 text-center">
      <div>
        <div className="font-poster text-6xl text-text-primary">404</div>
        <p className="mt-3 text-text-secondary">Không tìm thấy trang bạn yêu cầu.</p>
        <Button asChild className="mt-6">
          <Link to="/">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}

import { Button } from "../components/common/Button";

export const Home = () => {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Home ページ</h1>
      <p>ここはメインのホーム画面です。</p>
      {/* TODO: S1-B-06 のAPI連携後に実装 */}
      <Button disabled className="w-full md:w-auto">
        きろくする
      </Button>
    </div>
  );
};

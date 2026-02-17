import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu Digital | Tasca do Vereda',
  description: 'Menu digital interativo da Tasca do Vereda',
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-950 min-h-screen w-full overflow-x-hidden m-0 p-0">
      {children}
    </div>
  );
}

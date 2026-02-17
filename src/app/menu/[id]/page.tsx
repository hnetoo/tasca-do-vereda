import MenuClient from '../MenuClient';

// Esta rota deve ser dinâmica para permitir o acesso via /menu/[id] (ex: /menu/mesa-1)
// Mas renderiza o mesmo componente MenuClient (o ID pode ser usado para tracking no futuro)

export default function MenuPage({ params }: { params: { id: string } }) {
  return <MenuClient />;
}

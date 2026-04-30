import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Veiculos from "./pages/Veiculos.tsx";
import VeiculoDetalhe from "./pages/VeiculoDetalhe.tsx";
import Transferencias from "./pages/Transferencias.tsx";
import Licenciamento from "./pages/Licenciamento.tsx";
import IPVA from "./pages/IPVA.tsx";
import Seguros from "./pages/Seguros.tsx";
import Pendencias from "./pages/Pendencias.tsx";
import Documentos from "./pages/Documentos.tsx";
import Cofre from "./pages/Cofre.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import Cadastros from "./pages/Cadastros.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/veiculos" element={<Veiculos />} />
              <Route path="/veiculos/:id" element={<VeiculoDetalhe />} />
              <Route path="/transferencias" element={<Transferencias />} />
              <Route path="/licenciamento" element={<Licenciamento />} />
              <Route path="/ipva" element={<IPVA />} />
              <Route path="/seguros" element={<Seguros />} />
              <Route path="/pendencias" element={<Pendencias />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/cofre" element={<Cofre />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/cadastros" element={<Cadastros />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

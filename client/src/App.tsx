import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

// Lazy load pages
const Home = lazy(() => import("./pages/home"));
const Categories = lazy(() => import("./pages/categories"));
const Chat = lazy(() => import("./pages/chat"));
const NotFound = lazy(() => import("./pages/not-found"));

function App() {
  const { toast } = useToast();

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/categories" component={Categories} />
          <Route path="/categories/:majorId" component={Categories} />
          <Route path="/chat/:majorId/:subId" component={Chat} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
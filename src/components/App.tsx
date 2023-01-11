import MTable from "./MTable";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
const App = ({}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <MTable />
    </QueryClientProvider>
  );
};

export default App;

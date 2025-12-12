// Build a control-flow graph (CFG) and detect:
// - **W_UNREACHABLE_STEP**: any step not reachable from `flow.entrypoint`
// - **E_CYCLE_DETECTED**: any directed cycle (v1 forbids cycles)

export interface CfgEdge {
    from: string;
    to: string;
    jsonPath: string;
  }
  
  export interface Cfg {
    nodes: Set<string>;
    edges: CfgEdge[];
    adj: Map<string, string[]>;
  }
  
  function pushAdj(adj: Map<string, string[]>, from: string, to: string) {
    const list = adj.get(from) ?? [];
    list.push(to);
    adj.set(from, list);
  }
  
  export function buildCfg(doc: any): Cfg {
    const nodes = new Set<string>();
    const edges: CfgEdge[] = [];
    const adj = new Map<string, string[]>();
  
    const steps = Array.isArray(doc.steps) ? doc.steps : [];
    for (const s of steps) nodes.add(s.id);
  
    for (const s of steps) {
      const flow = s.flow ?? {};
      const addEdge = (to: any, path: string) => {
        if (typeof to === "string" && to.length) {
          edges.push({ from: s.id, to, jsonPath: path });
          pushAdj(adj, s.id, to);
        }
      };
  
      addEdge(flow.next, `$.steps[?(@.id=="${s.id}")].flow.next`);
      addEdge(flow.true_next, `$.steps[?(@.id=="${s.id}")].flow.true_next`);
      addEdge(flow.false_next, `$.steps[?(@.id=="${s.id}")].flow.false_next`);
  
      if (flow.cases && typeof flow.cases === "object") {
        for (const [k, v] of Object.entries(flow.cases)) {
          addEdge(v, `$.steps[?(@.id=="${s.id}")].flow.cases.${k}`);
        }
      }
  
      addEdge(flow.on_error_next, `$.steps[?(@.id=="${s.id}")].flow.on_error_next`);
    }
  
    return { nodes, edges, adj };
  }
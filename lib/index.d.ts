/**
 * dsh-search-router — local multi-provider search router for DeepSeek Harness.
 *
 * Registers ONE wrapper provider (`router`) into `ctx.web` so the official
 * `web_search` tool routes through this plugin. The active backend is read
 * from `$DSH_HOME/search-router.json` on every search, which makes switching
 * instant (no restart). On failure or empty results the plugin walks the
 * configured fallback chain and annotates the result with a `content` note
 * (surfaced by the official `web_search` tool as its answer).
 *
 * Runtime dependencies: node builtins only.
 */
interface SearchSource {
    url: string;
    title?: string;
    snippet?: string;
    publishedAt?: string;
}
interface SearchResult {
    sources: SearchSource[];
    truncated: boolean;
    content?: string;
}
interface ApplyConfig {
    provider?: string;
    fallback?: string[];
    searxngInstances?: string[];
    maxResults?: number;
    anysearchApiKey?: string;
    deepseekApiKey?: string;
    anysearchApiKeyMask?: string;
    deepseekApiKeyMask?: string;
}
export declare const name = "web-search-router";
export declare const inject: string[];
declare function createRouterProvider(): {
    id: string;
    available(): boolean;
    search(request: {
        query: string;
        maxResults?: number;
    }, signal?: AbortSignal): Promise<SearchResult>;
};
export declare function apply(ctx: {
    web: {
        registerSearchProvider(provider: ReturnType<typeof createRouterProvider>): unknown;
    };
    tools: {
        register(definition: unknown): unknown;
    };
    inject(deps: string[], callback: (sctx: any) => void): void;
    logger?: {
        info(message: string): void;
    };
}, config?: ApplyConfig): void;
export {};

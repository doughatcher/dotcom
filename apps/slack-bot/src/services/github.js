/**
 * GitHub REST API helpers.
 * Covers file reads/writes, branch management, and PR operations.
 */
const GH_API = 'https://api.github.com';

async function ghFetch(path, options, token) {
  const res = await fetch(`${GH_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'editorial-slack-bot/1.0',
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API ${res.status}: ${err}`);
  }
  return res.json();
}

/**
 * Read a file from a GitHub repo.
 * Returns { content (decoded string), sha }
 */
export async function readFile(repo, path, token) {
  const data = await ghFetch(`/repos/${repo}/contents/${encodeURIComponent(path)}`, {}, token);
  const content = atob(data.content.replace(/\n/g, ''));
  return { content, sha: data.sha };
}

/**
 * Write (create or update) a file in a GitHub repo.
 * Returns the commit URL.
 */
export async function writeFile(repo, path, content, message, sha, token) {
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const body = { message, content: encoded };
  if (sha) body.sha = sha; // required for updates

  const data = await ghFetch(
    `/repos/${repo}/contents/${encodeURIComponent(path)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    token
  );

  return data.commit.html_url;
}

/**
 * List files in a directory (shallow, no recursion).
 * Returns array of { name, path, type }
 */
export async function listDir(repo, path, token) {
  return ghFetch(`/repos/${repo}/contents/${encodeURIComponent(path)}`, {}, token);
}

/**
 * Read a file from a specific branch/ref.
 * Returns { content (decoded string), sha }
 */
export async function readFileOnBranch(repo, filePath, ref, token) {
  const data = await ghFetch(
    `/repos/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(ref)}`,
    {},
    token
  );
  const content = atob(data.content.replace(/\n/g, ''));
  return { content, sha: data.sha };
}

/**
 * Get the SHA of a branch ref.
 */
export async function getRef(repo, branch, token) {
  const data = await ghFetch(`/repos/${repo}/git/ref/heads/${branch}`, {}, token);
  return data.object.sha;
}

/**
 * Create a new branch off a given SHA.
 */
export async function createBranch(repo, branchName, sha, token) {
  await ghFetch(`/repos/${repo}/git/refs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
  }, token);
}

/**
 * Create a new file on a specific branch (no sha needed — file must not exist).
 * Returns the commit URL.
 */
export async function createFileOnBranch(repo, filePath, content, message, branch, token) {
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const data = await ghFetch(
    `/repos/${repo}/contents/${encodeURIComponent(filePath)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: encoded, branch }),
    },
    token
  );
  return data.commit.html_url;
}

/**
 * Update an existing file on a specific branch.
 * Returns the commit URL.
 */
export async function updateFileOnBranch(repo, filePath, content, message, sha, branch, token) {
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const data = await ghFetch(
    `/repos/${repo}/contents/${encodeURIComponent(filePath)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: encoded, sha, branch }),
    },
    token
  );
  return data.commit.html_url;
}

/**
 * Create a Pull Request.
 * Returns { number, url }
 */
export async function createPR(repo, head, base, title, body, draft, token) {
  const data = await ghFetch(`/repos/${repo}/pulls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, head, base, body, draft }),
  }, token);
  return { number: data.number, url: data.html_url };
}

/**
 * List open PRs whose head branch starts with an optional prefix.
 * Returns array of PR objects from the GitHub API.
 */
export async function listPRs(repo, token, headPrefix) {
  const data = await ghFetch(`/repos/${repo}/pulls?state=open&per_page=50`, {}, token);
  if (headPrefix) return data.filter(pr => pr.head.ref.startsWith(headPrefix));
  return data;
}

/**
 * Return the latest editorial-loop batch of draft blog PRs, ordered to match
 * the numbered Slack post (idea 1 first). Groups by the YYYY-MM-DD prefix
 * embedded in the `blog/<date>-<slug>` branch name and picks the most recent
 * date, then sorts that group by PR creation time ascending.
 */
export async function getLatestIdeaBatch(repo, token) {
  const prs = await ghFetch(`/repos/${repo}/pulls?state=open&per_page=50`, {}, token);
  const dateOf = (pr) => {
    const m = pr.head.ref.match(/^blog\/(\d{4}-\d{2}-\d{2})-/);
    return m ? m[1] : null;
  };
  const drafts = prs.filter(pr => pr.draft && dateOf(pr));
  if (drafts.length === 0) return [];
  const latestDate = drafts.map(dateOf).sort().pop();
  return drafts
    .filter(pr => dateOf(pr) === latestDate)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

/**
 * Merge a PR by number (squash).
 */
export async function mergePR(repo, prNumber, token) {
  return ghFetch(`/repos/${repo}/pulls/${prNumber}/merge`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merge_method: 'squash' }),
  }, token);
}

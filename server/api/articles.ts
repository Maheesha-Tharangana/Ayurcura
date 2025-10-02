import { Express } from "express";
import fetch from "node-fetch";

// In-memory cache for articles to improve performance and reliability
const articlesCache: {
  [key: string]: {
    timestamp: number;
    data: any;
  }
} = {};

// Cache duration in milliseconds (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000;

// Function to get or set cached data
function getCachedData(cacheKey: string): any | null {
  const cachedItem = articlesCache[cacheKey];
  
  if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
    console.log(`Using cached data for ${cacheKey}`);
    return cachedItem.data;
  }
  
  return null;
}

function setCachedData(cacheKey: string, data: any): void {
  articlesCache[cacheKey] = {
    timestamp: Date.now(),
    data
  };
  console.log(`Cached data updated for ${cacheKey}`);
}

// Formatter for standardized article response format
type FormattedArticle = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  source: string;
  category: string;
  url: string;
};

// Helper function to safely parse JSON responses
const safeJsonParse = async (response: Response | import('node-fetch').Response): Promise<any> => {
  try {
    return await response.json();
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return {};
  }
};

// Generate header for API requests
function getApiHeaders(): HeadersInit {
  return {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "AyurCuraHealth/1.0 (health application; ayurcurahealth@example.com)"
  };
}

// Format a date string from various formats
function formatArticleDate(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toISOString();
  try {
    return new Date(dateStr).toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

// Function to refresh selected cached article sources
async function refreshArticleCache(): Promise<void> {
  try {
    console.log("Starting scheduled article cache refresh");
    
    // Common ayurveda-related search terms
    const searchTerms = ["ayurveda", "herbal medicine", "panchakarma", "yoga", "meditation"];
    const counts = [5, 10];
    
    for (const searchTerm of searchTerms) {
      for (const count of counts) {
        const cacheKey = `articles-${searchTerm}-${count}-all`;
        
        // Skip if this key was recently cached (less than 12 hours ago)
        const existingCache = articlesCache[cacheKey];
        if (existingCache && (Date.now() - existingCache.timestamp < 12 * 60 * 60 * 1000)) {
          console.log(`Skipping ${cacheKey}, data is still fresh`);
          continue;
        }
        
        console.log(`Refreshing article cache for: ${cacheKey}`);
        
        // Make request to Wikipedia API
        const wikiResponse = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}+ayurveda+medicine&gsrlimit=${count}&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=400&origin=*`,
          { headers: getApiHeaders() }
        );
        
        if (wikiResponse.ok) {
          const wikiData = await safeJsonParse(wikiResponse);
          const articles: FormattedArticle[] = [];
          
          if (wikiData.query && wikiData.query.pages) {
            // Get all pages and filter to only include those with thumbnails
            const pages = Object.values(wikiData.query.pages);
            const pagesWithImages = pages.filter((page: any) => page.thumbnail && page.thumbnail.source);
            
            // Only process pages with images
            (pagesWithImages.length > 0 ? pagesWithImages : pages).forEach((page: any) => {
              // Skip pages without thumbnails if we have enough pages with thumbnails
              if (pagesWithImages.length > 0 && !page.thumbnail) {
                return;
              }
              
              articles.push({
                id: `wiki-${page.pageid.toString()}`,
                title: page.title || 'Ayurvedic Article',
                description: page.extract || 'Information about Ayurvedic medicine and wellness.',
                imageUrl: page.thumbnail?.source || 
                  `https://source.unsplash.com/random/400x300/?ayurveda,${encodeURIComponent(page.title || searchTerm)},medicine`,
                date: new Date().toISOString(),
                source: 'wikipedia',
                category: 'Ayurveda',
                url: `https://en.wikipedia.org/?curid=${page.pageid}`
              });
            });
          }
          
          if (articles.length > 0) {
            setCachedData(cacheKey, {
              articles,
              count: articles.length,
              source: 'wikipedia',
              categories: [
                "Ayurvedic Treatments",
                "Herbal Medicine",
                "Traditional Medicine",
                "Natural Remedies",
                "Yoga",
                "Meditation", 
                "Health Practices"
              ]
            });
            console.log(`Cache updated for ${cacheKey} with ${articles.length} articles`);
          }
        }
        
        // Sleep for a short time between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log("Completed scheduled article cache refresh");
  } catch (error) {
    console.error("Error during automatic cache refresh:", error);
  }
}

// Set up regular refresh of article cache (every 24 hours)
setInterval(refreshArticleCache, 24 * 60 * 60 * 1000);

// Initial cache population (after 30 seconds to allow server to fully start)
setTimeout(refreshArticleCache, 30 * 1000);

export function registerArticleRoutes(app: Express) {
  /**
   * Admin endpoint to force refresh the article cache
   * POST /api/admin/refresh-articles
   */
  app.post('/api/admin/refresh-articles', async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (!req.isAuthenticated() || (req.user as any).role !== 'admin') {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Force a refresh of the article cache
      await refreshArticleCache();
      
      res.json({ success: true, message: 'Article cache refreshed successfully' });
    } catch (error) {
      console.error('Error refreshing article cache:', error);
      res.status(500).json({ message: 'Error refreshing article cache' });
    }
  });
  // Get articles from MedlinePlus API (Plain-Language Health Articles)
  app.get("/api/articles/medlineplus", async (req, res, next) => {
    try {
      const searchTerm = req.query.search?.toString() || "ayurveda";
      const count = parseInt(req.query.count?.toString() || "10");
      
      // MedlinePlus Solr API
      const response = await fetch(
        `https://wsearch.nlm.nih.gov/solr/medlineplus/select?q=${encodeURIComponent(searchTerm)}&wt=json&rows=${count}`,
        { headers: getApiHeaders() }
      );
      
      if (!response.ok) {
        throw new Error(`MedlinePlus API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const articles: FormattedArticle[] = [];
      
      // Process MedlinePlus results
      if (data.response && data.response.docs && Array.isArray(data.response.docs)) {
        data.response.docs.forEach((doc: any) => {
          const title = doc.title_display || doc.title || 'Health Article';
          const description = doc.FullSummary || doc.snippet || 'Health information from MedlinePlus.';
          
          // Create thumbnail URL from content ID if available
          let imageUrl = "";
          if (doc.content_id) {
            // Try to construct a likely image URL - MedlinePlus has image thumbnails in this format
            imageUrl = `https://medlineplus.gov/images/thumbnails/${doc.content_id}_${encodeURIComponent(title.slice(0, 20).toLowerCase().replace(/\W+/g, '-'))}.jpg`;
          } else {
            imageUrl = `https://source.unsplash.com/random/400x300/?health,${encodeURIComponent(searchTerm)}`;
          }
          
          // Create article URL from URL field or content ID
          const url = doc.url || (doc.content_id ? `https://medlineplus.gov/ency/article/${doc.content_id}.htm` : '');
          
          articles.push({
            id: doc.content_id?.toString() || doc.url?.split('/').pop() || Math.random().toString(36).substring(2, 11),
            title,
            description,
            imageUrl,
            date: formatArticleDate(doc.modified || doc.pubdate || doc.dateline),
            source: 'medlineplus',
            category: doc.healthcare_category || 'Health',
            url
          });
        });
      }
      
      res.json({
        articles,
        count: articles.length,
        source: 'medlineplus'
      });
    } catch (error) {
      console.error('MedlinePlus API error:', error);
      // Return empty results instead of error to prevent application from breaking
      res.json({
        articles: [],
        count: 0,
        source: 'medlineplus',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get medicine information from NIH DailyMed API (Drug Labels & Treatments)
  app.get("/api/articles/dailymed", async (req, res, next) => {
    try {
      const drugName = req.query.drug?.toString() || req.query.search?.toString() || "ashwagandha";
      const count = parseInt(req.query.count?.toString() || "5");
      
      // DailyMed search API
      const response = await fetch(
        `https://dailymed.nlm.nih.gov/dailymed/services/v2/drugnames.json?drug_name=${encodeURIComponent(drugName)}&page=1&pagesize=${count}`,
        { headers: getApiHeaders() }
      );
      
      if (!response.ok) {
        throw new Error(`DailyMed API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const articles: FormattedArticle[] = [];
      
      // Process DailyMed results
      if (data.data && Array.isArray(data.data)) {
        // Process each drug item
        for (const drug of data.data.slice(0, count)) {
          try {
            // Get additional details for each drug
            const setid = drug.setid;
            const drugResponse = await fetch(
              `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${setid}.json`,
              { headers: getApiHeaders() }
            );
            
            if (drugResponse.ok) {
              const drugData = await drugResponse.json();
              
              // Build description from drug data sections
              let description = drug.drug_name || "Herbal Medicine";
              if (drugData.data && drugData.data.sections) {
                const indicationSection = drugData.data.sections.find((s: any) => 
                  s.title.toLowerCase().includes('indication') || 
                  s.title.toLowerCase().includes('use')
                );
                if (indicationSection && indicationSection.text) {
                  // Clean up HTML tags if present
                  description = indicationSection.text
                    .replace(/<\/?[^>]+(>|$)/g, "")
                    .slice(0, 300) + "...";
                }
              }
              
              articles.push({
                id: drug.setid || Math.random().toString(36).substring(2, 11),
                title: drug.drug_name || 'Herbal Medicine',
                description,
                imageUrl: `https://dailymed.nlm.nih.gov/dailymed/image.cfm?setid=${setid}&name=0`,
                date: formatArticleDate(drugData.data?.published_date),
                source: 'dailymed',
                category: drug.dosage_form || 'Medication',
                url: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setid}`
              });
            }
          } catch (innerError) {
            console.error('Error fetching drug details:', innerError);
            // Continue with basic drug info only
            articles.push({
              id: drug.setid || Math.random().toString(36).substring(2, 11),
              title: drug.drug_name || 'Herbal Medicine',
              description: `Information about ${drug.drug_name || 'this medication'}.`,
              imageUrl: `https://source.unsplash.com/random/400x300/?medicine,${encodeURIComponent(drug.drug_name || drugName)}`,
              date: new Date().toISOString(),
              source: 'dailymed',
              category: drug.dosage_form || 'Medication',
              url: drug.setid ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${drug.setid}` : ''
            });
          }
          
          // Limit the number of sequential API calls
          if (articles.length >= count) break;
        }
      }
      
      res.json({
        articles,
        count: articles.length,
        source: 'dailymed'
      });
    } catch (error) {
      console.error('DailyMed API error:', error);
      res.json({
        articles: [],
        count: 0,
        source: 'dailymed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get health datasets from U.S. Open-Data Catalog
  app.get("/api/articles/datagov", async (req, res, next) => {
    try {
      const searchTerm = req.query.search?.toString() || "ayurveda";
      const count = parseInt(req.query.count?.toString() || "5");
      
      // U.S. Data.gov search API
      const response = await fetch(
        `https://catalog.data.gov/api/3/action/package_search?q=${encodeURIComponent(searchTerm)}&rows=${count}&fq=tags:health`,
        { headers: getApiHeaders() }
      );
      
      if (!response.ok) {
        throw new Error(`Data.gov API error: ${response.statusText}`);
      }
      
      const data = await safeJsonParse(response);
      const articles: FormattedArticle[] = [];
      
      if (data.result && Array.isArray(data.result.results)) {
        data.result.results.forEach((result: any) => {
          // Find a suitable resource URL if available
          let resourceUrl = '';
          if (result.resources && result.resources.length > 0) {
            const resource = result.resources.find((r: any) => r.format && 
              (r.format.toLowerCase().includes('html') || r.format.toLowerCase().includes('web')));
            resourceUrl = resource?.url || result.resources[0]?.url || '';
          }
          
          articles.push({
            id: result.id || result.name || Math.random().toString(36).substring(2, 11),
            title: result.title || result.name || 'Health Dataset',
            description: result.notes || result.description || 'Health dataset from U.S. Open-Data Catalog.',
            imageUrl: `https://source.unsplash.com/random/400x300/?data,health,${encodeURIComponent(searchTerm)}`,
            date: formatArticleDate(result.metadata_modified || result.metadata_created),
            source: 'datagov',
            category: (result.groups && result.groups[0]?.display_name) || 'Health Data',
            url: resourceUrl || `https://catalog.data.gov/dataset/${result.name}`
          });
        });
      }
      
      res.json({
        articles,
        count: articles.length,
        source: 'datagov'
      });
    } catch (error) {
      console.error('Data.gov API error:', error);
      res.json({
        articles: [],
        count: 0,
        source: 'datagov',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get FDA data about drugs and recalls
  app.get("/api/articles/openfda", async (req, res, next) => {
    try {
      const searchTerm = req.query.search?.toString() || "ayurvedic";
      const count = parseInt(req.query.count?.toString() || "5");
      
      // OpenFDA API (drug labels endpoint)
      const response = await fetch(
        `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(searchTerm)}&limit=${count}`,
        { headers: getApiHeaders() }
      );
      
      if (!response.ok) {
        throw new Error(`OpenFDA API error: ${response.statusText}`);
      }
      
      const data = await safeJsonParse(response);
      const articles: FormattedArticle[] = [];
      
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((result: any) => {
          // Get first brand name or generic name
          const brandName = result.openfda?.brand_name?.[0] || '';
          const genericName = result.openfda?.generic_name?.[0] || '';
          const substanceName = result.openfda?.substance_name?.[0] || '';
          
          // Build title from available drug names
          const title = brandName || genericName || substanceName || 'Medication Information';
          
          // Extract description from various possible fields
          let description = '';
          if (result.indications_and_usage) {
            description = Array.isArray(result.indications_and_usage) 
              ? result.indications_and_usage[0] 
              : result.indications_and_usage;
          } else if (result.description) {
            description = Array.isArray(result.description) 
              ? result.description[0] 
              : result.description;
          } else if (result.purpose) {
            description = Array.isArray(result.purpose) 
              ? result.purpose[0] 
              : result.purpose;
          }
          
          // Clean up description and trim to reasonable length
          description = description
            .replace(/<\/?[^>]+(>|$)/g, "")
            .slice(0, 300);
          if (description.length === 300) description += "...";
          
          articles.push({
            id: result.id || result.set_id || Math.random().toString(36).substring(2, 11),
            title,
            description: description || 'FDA approved medication information.',
            imageUrl: `https://source.unsplash.com/random/400x300/?medicine,${encodeURIComponent(title)}`,
            date: formatArticleDate(result.effective_time),
            source: 'openfda',
            category: 'FDA Medication',
            url: result.set_id 
              ? `https://labels.fda.gov/getPackageInsert.cfm?id=${result.set_id}` 
              : `https://www.accessdata.fda.gov/scripts/cder/daf/`
          });
        });
      }
      
      res.json({
        articles,
        count: articles.length,
        source: 'openfda'
      });
    } catch (error) {
      console.error('OpenFDA API error:', error);
      res.json({
        articles: [],
        count: 0,
        source: 'openfda',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint to get a single article by ID from any source
  app.get("/api/articles/:source/:id", async (req, res) => {
    try {
      const { source, id } = req.params;
      
      console.log(`Fetching article with source: ${source}, id: ${id}`);
      
      if (!source || !id) {
        return res.status(400).json({ 
          error: "Missing source or article ID"
        });
      }
      
      let article: FormattedArticle | null = null;
      
      // Handle different sources
      switch (source) {
        case "medlineplus": {
          // For MedlinePlus, if we have a numeric ID, we can try to get the article directly
          const response = await fetch(
            `https://wsearch.nlm.nih.gov/solr/medlineplus/select?q=content_id:${id}&wt=json`,
            { headers: getApiHeaders() }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.response?.docs?.length > 0) {
              const doc = data.response.docs[0];
              
              let imageUrl = "";
              if (doc.content_id) {
                // Try to construct a likely image URL
                const title = doc.title_display || doc.title || 'Health Article';
                imageUrl = `https://medlineplus.gov/images/thumbnails/${doc.content_id}_${encodeURIComponent(title.slice(0, 20).toLowerCase().replace(/\W+/g, '-'))}.jpg`;
              } else {
                imageUrl = `https://source.unsplash.com/random/800x600/?health,medicine`;
              }
              
              const url = doc.url || (doc.content_id ? `https://medlineplus.gov/ency/article/${doc.content_id}.htm` : '');
              
              article = {
                id: doc.content_id?.toString() || Math.random().toString(36).substring(2, 11),
                title: doc.title_display || doc.title || 'Health Article',
                description: doc.FullSummary || doc.snippet || doc.text || 'Health information from MedlinePlus.',
                imageUrl,
                date: formatArticleDate(doc.modified || doc.pubdate || doc.dateline),
                source: 'medlineplus',
                category: doc.healthcare_category || 'Health',
                url
              };
            }
          }
          break;
        }
        
        case "dailymed": {
          // For DailyMed, we use the setid as the ID
          const response = await fetch(
            `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${id}.json`,
            { headers: getApiHeaders() }
          );
          
          if (response.ok) {
            const data = await response.json();
            
            // Build description from various sections
            let description = "";
            let drugName = "";
            
            if (data.data) {
              drugName = data.data.drug_names?.[0]?.name || 'Medication';
              
              if (data.data.sections) {
                const indSection = data.data.sections.find((s: any) => 
                  s.title?.toLowerCase().includes('indication') || 
                  s.title?.toLowerCase().includes('use')
                );
                
                if (indSection?.text) {
                  description = indSection.text.replace(/<\/?[^>]+(>|$)/g, "");
                  
                  // Also try to get more sections for a fuller article
                  const descSections = data.data.sections.filter((s: any) => 
                    s.title?.toLowerCase().includes('description') || 
                    s.title?.toLowerCase().includes('mechanism') ||
                    s.title?.toLowerCase().includes('pharmacology') ||
                    s.title?.toLowerCase().includes('clinical')
                  );
                  
                  if (descSections.length > 0) {
                    for (const sect of descSections) {
                      if (sect.text) {
                        description += '\n\n' + sect.title + '\n\n' + 
                                      sect.text.replace(/<\/?[^>]+(>|$)/g, "");
                      }
                    }
                  }
                }
              }
            }
            
            article = {
              id: id,
              title: drugName,
              description: description || 'Information about this medication.',
              imageUrl: `https://dailymed.nlm.nih.gov/dailymed/image.cfm?setid=${id}&name=0`,
              date: formatArticleDate(data.data?.published_date),
              source: 'dailymed',
              category: 'Medication',
              url: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${id}`
            };
          }
          break;
        }
        
        case "openfda": {
          const response = await fetch(
            `https://api.fda.gov/drug/label.json?search=set_id:${id}`,
            { headers: getApiHeaders() }
          );
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              const result = data.results[0];
              
              // Extract names and descriptions
              const brandName = result.openfda?.brand_name?.[0] || '';
              const genericName = result.openfda?.generic_name?.[0] || '';
              const substanceName = result.openfda?.substance_name?.[0] || '';
              
              const title = brandName || genericName || substanceName || 'Medication Information';
              
              // Build a detailed description from available fields
              let description = '';
              
              if (result.indications_and_usage) {
                const ind = Array.isArray(result.indications_and_usage) 
                  ? result.indications_and_usage.join('\n\n')
                  : result.indications_and_usage;
                description += 'INDICATIONS AND USAGE:\n\n' + ind.replace(/<\/?[^>]+(>|$)/g, "");
              }
              
              if (result.dosage_and_administration) {
                const dosage = Array.isArray(result.dosage_and_administration) 
                  ? result.dosage_and_administration.join('\n\n')
                  : result.dosage_and_administration;
                description += '\n\nDOSAGE AND ADMINISTRATION:\n\n' + dosage.replace(/<\/?[^>]+(>|$)/g, "");
              }
              
              if (result.adverse_reactions) {
                const reactions = Array.isArray(result.adverse_reactions) 
                  ? result.adverse_reactions.join('\n\n')
                  : result.adverse_reactions;
                description += '\n\nADVERSE REACTIONS:\n\n' + reactions.replace(/<\/?[^>]+(>|$)/g, "");
              }
              
              if (result.drug_interactions) {
                const interactions = Array.isArray(result.drug_interactions) 
                  ? result.drug_interactions.join('\n\n')
                  : result.drug_interactions;
                description += '\n\nDRUG INTERACTIONS:\n\n' + interactions.replace(/<\/?[^>]+(>|$)/g, "");
              }
              
              if (!description && result.description) {
                description = Array.isArray(result.description) 
                  ? result.description.join('\n\n')
                  : result.description;
              }
              
              article = {
                id,
                title,
                description: description || 'FDA approved medication information.',
                imageUrl: `https://source.unsplash.com/random/800x600/?medicine,${encodeURIComponent(title)}`,
                date: formatArticleDate(result.effective_time),
                source: 'openfda',
                category: 'FDA Medication',
                url: `https://labels.fda.gov/getPackageInsert.cfm?id=${id}`
              };
            }
          }
          break;
        }
        
        case "datagov": {
          const response = await fetch(
            `https://catalog.data.gov/api/3/action/package_show?id=${id}`,
            { headers: getApiHeaders() }
          );
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.result) {
              const result = data.result;
              
              // Find a suitable resource URL
              let resourceUrl = '';
              if (result.resources && result.resources.length > 0) {
                const resource = result.resources.find((r: any) => r.format && 
                  (r.format.toLowerCase().includes('html') || r.format.toLowerCase().includes('web')));
                resourceUrl = resource?.url || result.resources[0]?.url || '';
              }
              
              article = {
                id: result.id || result.name || id,
                title: result.title || result.name || 'Health Dataset',
                description: result.notes || result.description || 'Health dataset from U.S. Open-Data Catalog.',
                imageUrl: `https://source.unsplash.com/random/800x600/?data,health`,
                date: formatArticleDate(result.metadata_modified || result.metadata_created),
                source: 'datagov',
                category: (result.groups && result.groups[0]?.display_name) || 'Health Data',
                url: resourceUrl || `https://catalog.data.gov/dataset/${result.name}`
              };
            }
          }
          break;
        }
        
        case "wikipedia": {
          const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${id}`,
            { headers: getApiHeaders() }
          );
          
          if (response.ok) {
            const data = await response.json();
            
            article = {
              id: data.pageid?.toString() || id,
              title: data.title || 'Wikipedia Article',
              description: data.extract || data.extract_html?.replace(/<\/?[^>]+(>|$)/g, "") || 'Information from Wikipedia.',
              imageUrl: data.thumbnail?.source || `https://source.unsplash.com/random/800x600/?${encodeURIComponent(data.title || 'ayurveda')}`,
              date: new Date().toISOString(),
              source: 'wikipedia',
              category: 'Encyclopedia',
              url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title || id)}`
            };
          } else {
            // Try to look up by pageid
            try {
              const pageResponse = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&pageids=${id}&format=json&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=800&origin=*`,
                { headers: getApiHeaders() }
              );
              
              if (pageResponse.ok) {
                const pageData = await pageResponse.json();
                
                if (pageData.query?.pages && pageData.query.pages[id]) {
                  const page = pageData.query.pages[id];
                  
                  article = {
                    id,
                    title: page.title || 'Wikipedia Article',
                    description: page.extract || 'Information from Wikipedia.',
                    imageUrl: page.thumbnail?.source || `https://source.unsplash.com/random/800x600/?${encodeURIComponent(page.title || 'ayurveda')}`,
                    date: new Date().toISOString(),
                    source: 'wikipedia',
                    category: 'Encyclopedia',
                    url: `https://en.wikipedia.org/?curid=${id}`
                  };
                }
              }
            } catch (innerError) {
              console.error('Error fetching Wikipedia page by ID:', innerError);
            }
          }
          break;
        }
      }
      
      // If the source is "all", we need to try different sources
      if (source === 'all' && !article) {
        // Try to look up the article in Wikipedia first
        try {
          console.log(`Source is 'all', trying Wikipedia for ID: ${id}`);
          const wikiResponse = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${id}`,
            { headers: getApiHeaders() }
          );
          
          if (wikiResponse.ok) {
            const wikiData = await wikiResponse.json();
            article = {
              id: wikiData.pageid?.toString() || id,
              title: wikiData.title || 'Wikipedia Article',
              description: wikiData.extract || 'Information from Wikipedia.',
              imageUrl: wikiData.thumbnail?.source || `https://source.unsplash.com/random/800x600/?ayurveda`,
              date: new Date().toISOString(),
              source: 'wikipedia',
              category: 'Encyclopedia',
              url: wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${id}`
            };
          }
        } catch (error) {
          console.error('Error trying Wikipedia source:', error);
        }
      }
      
      if (article) {
        console.log(`Found article: ${article.title}`);
        return res.json(article);
      } else {
        console.log(`Article not found for source: ${source}, id: ${id}`);
        return res.status(404).json({
          error: "Article not found"
        });
      }
    } catch (error) {
      console.error(`Error fetching article: ${error}`);
      return res.status(500).json({
        error: "Failed to retrieve article"
      });
    }
  });

  // Get Wikipedia/Wikimedia data for Ayurvedic terms
  app.get("/api/articles/wikipedia", async (req, res, next) => {
    try {
      const term = req.query.term?.toString() || req.query.search?.toString() || "Ayurveda";
      const count = parseInt(req.query.count?.toString() || "10");
      const requestedCategory = req.query.category?.toString() || "";
      
      // Define Ayurveda-related categories
      const categories = [
        "Ayurvedic Treatments",
        "Herbal Medicine",
        "Traditional Medicine",
        "Natural Remedies",
        "Yoga",
        "Meditation", 
        "Health Practices"
      ];
      
      // Create a search string based on the requested category
      let searchString = term;
      if (requestedCategory) {
        searchString = `${term} ${requestedCategory}`;
      }
      
      console.log(`Searching Wikipedia for: ${searchString}`);
      
      // Use the Wikipedia search API to get multiple results
      const searchResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages|categories&generator=search&gsrsearch=${encodeURIComponent(searchString)}&gsrlimit=${count}&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=400&origin=*`,
        { headers: getApiHeaders() }
      );
      
      if (!searchResponse.ok) {
        throw new Error(`Wikipedia API error: ${searchResponse.statusText}`);
      }
      
      const searchData = await searchResponse.json();
      const articles: FormattedArticle[] = [];
      
      if (searchData.query && searchData.query.pages) {
        // Classify articles into categories based on content or titles
        Object.values(searchData.query.pages).forEach((page: any) => {
          // Determine the most appropriate category based on title and content
          let category = "Ayurveda";
          
          // Check title and extract for category keywords
          const titleAndExtract = (page.title + " " + (page.extract || "")).toLowerCase();
          
          if (titleAndExtract.includes("treatment") || titleAndExtract.includes("therapy")) {
            category = "Ayurvedic Treatments";
          } else if (titleAndExtract.includes("herb") || titleAndExtract.includes("plant")) {
            category = "Herbal Medicine";
          } else if (titleAndExtract.includes("yoga") || titleAndExtract.includes("posture") || titleAndExtract.includes("asana")) {
            category = "Yoga";
          } else if (titleAndExtract.includes("meditation") || titleAndExtract.includes("mindful")) {
            category = "Meditation";
          } else if (titleAndExtract.includes("traditional") || titleAndExtract.includes("ancient")) {
            category = "Traditional Medicine";
          } else if (titleAndExtract.includes("remedy") || titleAndExtract.includes("natural cure")) {
            category = "Natural Remedies";
          } else if (titleAndExtract.includes("diet") || titleAndExtract.includes("nutrition") || 
                    titleAndExtract.includes("lifestyle") || titleAndExtract.includes("practice")) {
            category = "Health Practices";
          }
          
          // If a specific category was requested, prioritize it
          if (requestedCategory) {
            category = requestedCategory.charAt(0).toUpperCase() + requestedCategory.slice(1);
          }
          
          articles.push({
            id: page.pageid?.toString() || Math.random().toString(36).substring(2, 11),
            title: page.title || 'Ayurvedic Term',
            description: page.extract || 'Information about Ayurvedic medicine and wellness.',
            imageUrl: page.thumbnail?.source || `https://source.unsplash.com/random/400x300/?${encodeURIComponent(page.title)},ayurveda`,
            date: new Date().toISOString(),
            source: 'wikipedia',
            category: category,
            url: `https://en.wikipedia.org/?curid=${page.pageid}`
          });
        });
      }
      
      // If we don't have enough results, try a more general search
      if (articles.length === 0) {
        console.log("No specific results found, trying broader search");
        const fallbackResponse = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&generator=search&gsrsearch=ayurveda+medicine+health&gsrlimit=${count}&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=400&origin=*`,
          { headers: getApiHeaders() }
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.query && fallbackData.query.pages) {
            Object.values(fallbackData.query.pages).forEach((page: any) => {
              articles.push({
                id: page.pageid?.toString() || Math.random().toString(36).substring(2, 11),
                title: page.title || 'Ayurvedic Term',
                description: page.extract || 'Information about Ayurvedic medicine and wellness.',
                imageUrl: page.thumbnail?.source || `https://source.unsplash.com/random/400x300/?ayurveda,medicine`,
                date: new Date().toISOString(),
                source: 'wikipedia',
                category: 'Ayurveda',
                url: `https://en.wikipedia.org/?curid=${page.pageid}`
              });
            });
          }
        }
      }
      
      res.json({
        articles,
        count: articles.length,
        source: 'wikipedia',
        categories: categories
      });
    } catch (error) {
      console.error('Wikipedia API error:', error);
      res.json({
        articles: [],
        count: 0,
        source: 'wikipedia',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Main endpoint to get all articles (using only Wikipedia)
  app.get("/api/articles", async (req, res) => {
    try {
      const searchTerm = req.query.search?.toString() || "ayurveda";
      const count = parseInt(req.query.count?.toString() || "10");
      const category = req.query.category?.toString();
      
      console.log(`Fetching articles with search: ${searchTerm}, category: ${category || 'all'}`);
      
      // Create a cache key based on the request parameters
      const cacheKey = `articles-${searchTerm}-${count}-${category || 'all'}`;
      
      // Check if we have cached data for this request
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // We'll only use Wikipedia articles for simplicity and reliability
      
      // Define all predefined categories
      const categories = [
        "Ayurvedic Treatments",
        "Herbal Medicine",
        "Traditional Medicine",
        "Natural Remedies",
        "Yoga",
        "Meditation", 
        "Health Practices"
      ];
      
      // Create a search string based on requested category
      let searchString = searchTerm;
      if (category) {
        searchString = `${searchTerm} ${category}`;
      }
      
      // Use Wikipedia to get articles
      const wikiResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&generator=search&gsrsearch=${encodeURIComponent(searchString)}+ayurveda+medicine&gsrlimit=${count}&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=400&origin=*`,
        { headers: getApiHeaders() }
      );
      
      const articles: FormattedArticle[] = [];
      
      if (wikiResponse.ok) {
        const wikiData = await safeJsonParse(wikiResponse);
        
        if (wikiData.query && wikiData.query.pages) {
          // Get all pages and filter to only include those with thumbnails
          const pages = Object.values(wikiData.query.pages);
          
          // First try to find pages with thumbnails
          const pagesWithImages = pages.filter((page: any) => page.thumbnail && page.thumbnail.source);
          
          // Only process pages with images
          (pagesWithImages.length > 0 ? pagesWithImages : pages).forEach((page: any) => {
            // Skip pages without thumbnails if we have enough pages with thumbnails
            if (pagesWithImages.length > 0 && !page.thumbnail) {
              return;
            }
            
            // Determine the most appropriate category based on title and content
            let articleCategory = "Ayurveda";
            
            // Check title and extract for category keywords
            const titleAndExtract = (page.title + " " + (page.extract || "")).toLowerCase();
            
            if (titleAndExtract.includes("treatment") || titleAndExtract.includes("therapy")) {
              articleCategory = "Ayurvedic Treatments";
            } else if (titleAndExtract.includes("herb") || titleAndExtract.includes("plant")) {
              articleCategory = "Herbal Medicine";
            } else if (titleAndExtract.includes("yoga") || titleAndExtract.includes("posture") || titleAndExtract.includes("asana")) {
              articleCategory = "Yoga";
            } else if (titleAndExtract.includes("meditation") || titleAndExtract.includes("mindful")) {
              articleCategory = "Meditation";
            } else if (titleAndExtract.includes("traditional") || titleAndExtract.includes("ancient")) {
              articleCategory = "Traditional Medicine";
            } else if (titleAndExtract.includes("remedy") || titleAndExtract.includes("natural cure")) {
              articleCategory = "Natural Remedies";
            } else if (titleAndExtract.includes("diet") || titleAndExtract.includes("nutrition") || 
                      titleAndExtract.includes("lifestyle") || titleAndExtract.includes("practice")) {
              articleCategory = "Health Practices";
            }
            
            // If a specific category was requested, prioritize it
            if (category) {
              articleCategory = category.charAt(0).toUpperCase() + category.slice(1);
            }
            
            articles.push({
              id: `wiki-${page.pageid.toString()}`,
              title: page.title || 'Ayurvedic Article',
              description: page.extract || 'Information about Ayurvedic medicine and wellness.',
              imageUrl: page.thumbnail?.source || 
                `https://source.unsplash.com/random/400x300/?ayurveda,${encodeURIComponent(page.title || searchTerm)},medicine`,
              date: new Date().toISOString(),
              source: 'wikipedia',
              category: articleCategory,
              url: `https://en.wikipedia.org/?curid=${page.pageid}`
            });
          });
          
          console.log(`Found ${articles.length} articles, ${pagesWithImages.length} with images`);
        }
      }
      
      // If we don't have results, try a more general search
      if (articles.length === 0) {
        console.log("No specific results found, trying broader search for Ayurveda");
        const fallbackResponse = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages&generator=search&gsrsearch=ayurveda+medicine+health&gsrlimit=${count}&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=400&origin=*`,
          { headers: getApiHeaders() }
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.query && fallbackData.query.pages) {
            // Get all pages and filter to only include those with thumbnails
            const pages = Object.values(fallbackData.query.pages);
            const pagesWithImages = pages.filter((page: any) => page.thumbnail && page.thumbnail.source);
            
            // If we have pages with images, only use those
            (pagesWithImages.length > 0 ? pagesWithImages : pages).forEach((page: any) => {
              // Skip pages without thumbnails if we have enough pages with thumbnails
              if (pagesWithImages.length > 0 && !page.thumbnail) {
                return;
              }
              
              articles.push({
                id: `wiki-${page.pageid.toString()}`,
                title: page.title || 'Ayurvedic Term',
                description: page.extract || 'Information about Ayurvedic medicine and wellness.',
                imageUrl: page.thumbnail?.source || `https://source.unsplash.com/random/400x300/?ayurveda,medicine`,
                date: new Date().toISOString(),
                source: 'wikipedia',
                category: 'Ayurveda',
                url: `https://en.wikipedia.org/?curid=${page.pageid}`
              });
            });
            
            console.log(`Fallback search found ${pagesWithImages.length} articles with images`);
          }
        }
      }
      
      console.log(`Found ${articles.length} Wikipedia articles`);
      
      // Prepare the response data
      const responseData = {
        articles,
        count: articles.length,
        source: 'wikipedia',
        categories
      };
      
      // Store in cache before sending response
      setCachedData(cacheKey, responseData);
      
      res.json(responseData);
    } catch (error) {
      console.error('Articles API error:', error);
      
      // Create fallback articles when API fails
      const requestedCount = parseInt(req.query.count?.toString() || "10");
      const fallbackImages = [
        "https://source.unsplash.com/random/400x300/?ayurveda,herbs",
        "https://source.unsplash.com/random/400x300/?traditional,medicine",
        "https://source.unsplash.com/random/400x300/?yoga,meditation",
        "https://source.unsplash.com/random/400x300/?herbal,remedy"
      ];
      
      const fallbackArticles = [
        {
          id: "fallback-1",
          title: "Ayurveda: Ancient Wisdom for Modern Health",
          description: "Ayurveda is an alternative medicine system with historical roots in the Indian subcontinent. It is heavily practised throughout India and Nepal, where around 80% of the population report using it.",
          imageUrl: fallbackImages[0],
          date: new Date().toISOString(),
          source: "wikipedia",
          category: "Ayurvedic Treatments",
          url: "https://en.wikipedia.org/wiki/Ayurveda"
        },
        {
          id: "fallback-2",
          title: "Traditional Medicine: Global Practices",
          description: "Traditional medicine comprises medical aspects of traditional knowledge that developed over generations within various societies before the era of modern medicine.",
          imageUrl: fallbackImages[1],
          date: new Date().toISOString(),
          source: "wikipedia",
          category: "Traditional Medicine",
          url: "https://en.wikipedia.org/wiki/Traditional_medicine"
        },
        {
          id: "fallback-3",
          title: "Yoga and Meditation for Holistic Wellness",
          description: "Yoga is a group of physical, mental, and spiritual practices originating in ancient India. Combined with meditation, it provides comprehensive benefits for overall health.",
          imageUrl: fallbackImages[2],
          date: new Date().toISOString(),
          source: "wikipedia",
          category: "Yoga",
          url: "https://en.wikipedia.org/wiki/Yoga"
        },
        {
          id: "fallback-4",
          title: "Herbal Remedies in Ayurvedic Practice",
          description: "Herbal medicine is the study of pharmacognosy and the use of medicinal plants. Plants have been the basis for medical treatments through much of human history.",
          imageUrl: fallbackImages[3],
          date: new Date().toISOString(),
          source: "wikipedia",
          category: "Herbal Medicine",
          url: "https://en.wikipedia.org/wiki/Herbal_medicine"
        }
      ];
      
      // Limit the number of fallback articles to match the requested count
      const limitedFallbackArticles = fallbackArticles.slice(0, requestedCount);
      
      res.json({
        articles: limitedFallbackArticles,
        count: limitedFallbackArticles.length,
        source: 'fallback',
        categories: [
          "Ayurvedic Treatments",
          "Herbal Medicine",
          "Traditional Medicine",
          "Natural Remedies",
          "Yoga",
          "Meditation", 
          "Health Practices"
        ]
      });
    }
  });
}

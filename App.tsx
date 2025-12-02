import React, { useState, useCallback, useMemo } from 'react';
import { analyzeEmotion } from './services/geminiService';
import { Emotion, Sentiment, AnalysisResult, AnalysisRecord } from './types';

// --- Reusable SVG Icons ---
const JoyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SadnessIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const AngerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 14H9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 9.5l-1.5-1.5-1.5 1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 9.5l1.5-1.5 1.5 1.5" />
    </svg>
);

const FearIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9h.01M14 9h.01" />
    </svg>
);

const SurpriseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <circle cx="12" cy="14" r="1" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01" />
    </svg>
);

const NeutralFaceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 1.742 0 3.223.835 3.772 2M12 18a9 9 0 110-18 9 9 0 010 18zM9 13h6" />
    </svg>
);

const PositiveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const NegativeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


// --- UI Sub-components ---
const StatCard: React.FC<{ title: string; value?: string | number; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700 flex flex-col">
        <h3 className="font-medium text-gray-400">{title}</h3>
        {value !== undefined && <p className="mt-2 text-3xl font-bold text-white">{value}</p>}
        {children && <div className="mt-4">{children}</div>}
    </div>
);

const emotionConfig: { [key in Emotion]: { color: string; bgColor: string; Icon: React.FC<{className?: string}> } } = {
    [Emotion.Joy]: { color: 'yellow-400', bgColor: 'bg-yellow-500', Icon: JoyIcon },
    [Emotion.Sadness]: { color: 'blue-400', bgColor: 'bg-blue-500', Icon: SadnessIcon },
    [Emotion.Anger]: { color: 'red-400', bgColor: 'bg-red-500', Icon: AngerIcon },
    [Emotion.Fear]: { color: 'purple-400', bgColor: 'bg-purple-500', Icon: FearIcon },
    [Emotion.Surprise]: { color: 'indigo-400', bgColor: 'bg-indigo-500', Icon: SurpriseIcon },
    [Emotion.Neutral]: { color: 'gray-400', bgColor: 'bg-gray-500', Icon: NeutralFaceIcon },
};

const sentimentConfig: { [key in Sentiment]: { color: string; bgColor: string; Icon: React.FC<{className?: string}> } } = {
    [Sentiment.Positive]: { color: 'green-400', bgColor: 'bg-green-500', Icon: PositiveIcon },
    [Sentiment.Negative]: { color: 'red-400', bgColor: 'bg-red-500', Icon: NegativeIcon },
    [Sentiment.Neutral]: { color: 'gray-400', bgColor: 'bg-gray-500', Icon: NeutralFaceIcon },
};


const DistributionDisplay: React.FC<{ 
    distribution: Record<string, number>;
    total: number;
    config: { [key: string]: { color: string; bgColor: string }};
    title: string;
}> = ({ distribution, total, config, title }) => {
    if (total === 0) return <div className="text-sm text-gray-500">Not enough data for {title}.</div>;
    const items = Object.keys(config);

    return (
        <div className="space-y-2">
            {items.map(item => {
                const count = distribution[item] || 0;
                if (count === 0) return null;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                    <div key={item} className="flex items-center text-sm">
                        <span className="w-20 capitalize">{item}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2 mx-2">
                            <div className={`${config[item].bgColor} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="w-8 text-right font-mono">{count}</span>
                    </div>
                );
            })}
        </div>
    );
};


const DashboardStats: React.FC<{ history: AnalysisRecord[] }> = ({ history }) => {
    const stats = useMemo(() => {
        const totalAnalyses = history.length;
        if (totalAnalyses === 0) return null;
        
        const getDistribution = <T extends string>(getSource: (record: AnalysisRecord) => T) => 
            history.reduce((acc, record) => {
                const key = getSource(record);
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<T, number>);

        return {
            totalAnalyses,
            modelEmotionDist: getDistribution(r => r.modelResult.emotion),
            modelSentimentDist: getDistribution(r => r.modelResult.sentiment),
        };
    }, [history]);
    
    if (!stats) return null;

    return (
        <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-300">Dashboard Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Analyses" value={stats.totalAnalyses} />
                <StatCard title="Model Emotion Breakdown">
                    <DistributionDisplay distribution={stats.modelEmotionDist} total={stats.totalAnalyses} config={emotionConfig} title="Model Emotions" />
                </StatCard>
                <StatCard title="Model Sentiment Breakdown">
                    <DistributionDisplay distribution={stats.modelSentimentDist} total={stats.totalAnalyses} config={sentimentConfig} title="Model Sentiments" />
                </StatCard>
            </div>
        </section>
    );
};

const EmotionResultCard: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    const { color, Icon } = emotionConfig[result.emotion];
    const sentimentInfo = sentimentConfig[result.sentiment];
    const scorePercentage = (result.score * 100).toFixed(0);
    const SentimentIcon = sentimentInfo.Icon;

    return (
        <div className={`bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 transition-all duration-300 ease-in-out w-full max-w-sm`}>
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-gray-700" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className={`text-${color}`} strokeWidth="3" strokeDasharray={`${scorePercentage}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                        <Icon className={`w-12 h-12 text-${color}`} />
                    </div>
                </div>
                <div className="text-center">
                    <p className={`text-2xl font-bold text-${color}`}>{result.emotion}</p>
                    <p className="text-lg text-gray-300">Confidence: <span className="font-semibold">{scorePercentage}%</span></p>
                    <div className={`mt-2 inline-flex items-center text-sm px-2.5 py-0.5 rounded-full font-medium bg-${sentimentInfo.color.split('-')[0]}-500/20 text-${sentimentInfo.color}`}>
                        <SentimentIcon className="w-4 h-4 mr-1" />
                        {result.sentiment}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnalysisReportTable: React.FC<{ history: AnalysisRecord[] }> = ({ history }) => (
    <div className="w-full mt-10">
        <h2 className="text-2xl font-bold mb-4 text-center">Analysis Report</h2>
        {history.length === 0 ? (
             <p className="text-center text-gray-500">No analyses performed yet. Analyze some text to build the report.</p>
        ) : (
            <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-md border border-gray-700">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Text</th>
                            <th scope="col" className="px-6 py-3">Model Emotion</th>
                            <th scope="col" className="px-6 py-3">Model Sentiment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(record => (
                            <tr key={record.id} className={`border-b border-gray-700 hover:bg-gray-700/30 transition-colors`}>
                                <td className="px-6 py-4 font-medium text-gray-200 truncate max-w-xs" title={record.text}>{record.text}</td>
                                <td className="px-6 py-4">{record.modelResult.emotion} ({(record.modelResult.score * 100).toFixed(0)}%)</td>
                                <td className="px-6 py-4">{record.modelResult.sentiment}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);


export default function App() {
    const [text, setText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [analysisHistory, setAnalysisHistory] = useState<AnalysisRecord[]>([]);

    const handleAnalyze = useCallback(async () => {
        if (!text.trim()) {
            setError("Please enter some text to analyze.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const result = await analyzeEmotion(text);
            setAnalysisResult(result);
            
            const newRecord: AnalysisRecord = {
                id: new Date().toISOString(),
                text: text,
                modelResult: result,
            };
            setAnalysisHistory(prev => [newRecord, ...prev]);

        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [text]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                        Emotion Analysis Dashboard
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">Powered by Gemini API</p>
                </header>

                <DashboardStats history={analysisHistory} />

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* --- Input Column --- */}
                    <div className="flex flex-col">
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h2 className="text-xl font-bold mb-4">Enter Text for Analysis</h2>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="e.g., 'I can't believe we won the championship! I'm absolutely ecstatic and bursting with joy! This is the best day ever.'"
                                className="w-full h-48 p-4 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleAnalyze}
                                disabled={isLoading || !text.trim()}
                                className="mt-4 w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyzing...
                                    </>
                                ) : (
                                    'Analyze Emotion'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* --- Output Column --- */}
                    <div className="flex flex-col items-center justify-start">
                       {error && <div className="bg-red-500/20 text-red-300 p-4 rounded-lg w-full text-center mb-4">{error}</div>}
                        
                       {!isLoading && !analysisResult && !error && (
                            <div className="text-center text-gray-500 p-6 border-2 border-dashed border-gray-700 rounded-xl w-full max-w-sm">
                                <h3 className="text-lg font-medium">Results will appear here</h3>
                                <p>Enter some text and click "Analyze Emotion" to begin.</p>
                            </div>
                        )}
                        
                        {isLoading && (
                            <div className="text-center text-gray-400">
                                <svg className="animate-spin mx-auto h-12 w-12 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-2">Contacting Gemini...</p>
                            </div>
                        )}
                        
                        {analysisResult && !isLoading && (
                           <EmotionResultCard result={analysisResult} />
                        )}
                    </div>
                </main>
                
                <div className="mt-12">
                   <AnalysisReportTable history={analysisHistory} />
                </div>
            </div>
        </div>
    );
}

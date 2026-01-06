import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OtherSite {
    name: string;
    logoSrc: string;
    description: string;
    url: string;
}

interface OtherSitesProps {
    sites: OtherSite[];
}

const OtherSites: React.FC<OtherSitesProps> = ({ sites }) => {
    return (
        <div className="container mx-auto py-8">
            <h2 className="text-3xl font-bold text-center text-[var(--text-primary)] mb-8">Liked this site? Check out some of our others!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sites.map((site, index) => (
                    <Card key={index} className="flex flex-col">
                        <CardHeader className="flex-grow">
                            {/* Placeholder for logo - replace with actual image later */}
                            <div className="flex justify-center mb-4">
                                <img src={site.logoSrc} alt={`${site.name} Logo`} className="h-20 object-contain" />
                            </div>
                            <CardTitle className="text-center">{site.name}</CardTitle>
                            <CardDescription className="text-center mt-2">{site.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center pb-6">
                            <a href={site.url} target="_blank" rel="noopener noreferrer">
                                <Button>Visit Site</Button>
                            </a>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default OtherSites;

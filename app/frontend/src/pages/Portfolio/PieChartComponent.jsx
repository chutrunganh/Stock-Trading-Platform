import React, { useState, useMemo } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { Button, Typography, Box } from '@mui/material';

function PortfolioPieChart({ holdings, totalValue }) {
  const [view, setView] = useState('symbol');

  const handleViewChange = () => {
    setView((prevView) => (prevView === 'symbol' ? 'industry' : 'symbol'));
  };

  // Process data based on view type
  const chartData = useMemo(() => {
    console.log('Holdings data:', holdings); // Debug log
    console.log('Current view:', view); // Debug log

    if (!holdings || holdings.length === 0) {
      console.log('No holdings data available');
      return [];
    }

    if (view === 'symbol') {
      // Symbol view - direct mapping
      const symbolData = holdings
        .filter(holding => holding.holding_value > 0)
        .map((holding, idx) => ({
          id: holding.holding_id || idx,
          value: Number(holding.holding_value) || 0,
          label: holding.symbol,
        }));
      console.log('Symbol data:', symbolData); // Debug log
      return symbolData;
    } else {
      // Industry view - group by industry
      const industryGroups = holdings.reduce((groups, holding) => {
        if (!holding.holding_value || holding.holding_value <= 0) return groups;
        
        const industry = holding.industry || 'Unknown';
        if (!groups[industry]) {
          groups[industry] = 0;
        }
        groups[industry] += Number(holding.holding_value) || 0;
        return groups;
      }, {});

      console.log('Industry groups:', industryGroups); // Debug log

      // Convert to array format for pie chart
      const industryData = Object.entries(industryGroups)
        .map(([industry, value]) => ({
          id: industry,
          value,
          label: industry,
        }))
        .sort((a, b) => b.value - a.value); // Sort by value descending

      console.log('Industry data:', industryData); // Debug log
      return industryData;
    }
  }, [holdings, view]);

  // Custom colors for better visualization
  const colors = [
    '#2196f3', // Blue
    '#4caf50', // Green
    '#f44336', // Red
    '#ff9800', // Orange
    '#9c27b0', // Purple
    '#00bcd4', // Cyan
    '#ffeb3b', // Yellow
    '#795548', // Brown
    '#607d8b', // Blue Grey
    '#e91e63', // Pink
  ];

  const noDataMessage = !holdings || holdings.length === 0 
    ? "No holdings data available"
    : "No holdings with positive value";

  console.log('Final chart data:', chartData); // Debug log

  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Button 
        variant="contained" 
        onClick={handleViewChange} 
        sx={{ 
          mb: 2,
          backgroundColor: '#1976d2',
          '&:hover': {
            backgroundColor: '#115293'
          }
        }}
      >
        {view === 'symbol' ? 'Switch to Industry View' : 'Switch to Symbol View'}
      </Button>
      
      <Typography variant="h6" sx={{ mb: 2 }}>
        {view === 'symbol' ? 'Portfolio by Stock' : 'Portfolio by Industry'}
      </Typography>

      {chartData.length > 0 ? (
        <PieChart
          series={[
            {
              data: chartData,
              arcLabel: (item) => `${((item.value / totalValue) * 100).toFixed(1)}%`,
              arcLabelMinAngle: 20,
              innerRadius: 30,
              paddingAngle: 2,
              cornerRadius: 4,
              startAngle: -90,
              endAngle: 270,
              colors: colors,
              highlightScope: { faded: 'global', highlighted: 'item' },
            }
          ]}
          legend={{
            direction: 'horizontal',
            position: { vertical: 'bottom', horizontal: 'middle' },
            padding: 20,
            itemMarkWidth: 8,
            itemMarkHeight: 8,
            gap: 8,
            labelStyle: {
              fontSize: 12,
            }
          }}
          height={400}
          width={500}
          margin={{ top: 20, bottom: 40, left: 20, right: 20 }}
        />
      ) : (
        <Typography variant="body1" color="text.secondary">
          {noDataMessage}
        </Typography>
      )}
    </Box>
  );
}

export default PortfolioPieChart; 
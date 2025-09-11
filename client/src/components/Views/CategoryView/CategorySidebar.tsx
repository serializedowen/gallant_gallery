import React, { useState, useEffect } from 'react';
import { Category } from '../../../types/api-definitions';
import { useApp } from '../../../contexts/AppContext';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  Box,
  Paper,
} from '@mui/material';

interface CategorySidebarProps {
  categories: Category[];
  onCategorySelect: (categoryName: string) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  onCategorySelect,
}) => {
  const { selectedCategory, t } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] =
    useState<Category[]>(categories);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {t('category.title')}
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder={t('category.search.placeholder')}
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{ mb: 2 }}
      />
      <List>
        {filteredCategories.map((category) => (
          <ListItem key={category.name} disablePadding>
            <ListItemButton
              selected={selectedCategory === category.name}
              onClick={() => onCategorySelect(category.name)}
            >
              <ListItemText
                primary={category.name}
                secondary={
                  <Box component="span" sx={{ display: 'block' }}>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {category.itemCount} {t('stats.items')}
                    </Typography>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 2 }}
                    >
                      {category.imageCount} {t('stats.images')}
                    </Typography>
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default CategorySidebar;

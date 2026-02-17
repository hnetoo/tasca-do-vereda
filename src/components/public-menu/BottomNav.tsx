'use client';

import React from 'react';
import { Menu, ShoppingBasket, User, Receipt } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'menu' | 'cart' | 'account';
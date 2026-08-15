import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

/** Typed dispatch. Use instead of plain useDispatch. */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Typed selector. Use instead of plain useSelector. */
export const useAppSelector = useSelector.withTypes<RootState>();
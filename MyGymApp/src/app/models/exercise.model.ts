export interface Exercise{
    exercise_name: string;
    rep_range: number[];
    sets: number;
    current_weight: number;
    goal_weight: number;
    notes: string;
    saved?: boolean;
}
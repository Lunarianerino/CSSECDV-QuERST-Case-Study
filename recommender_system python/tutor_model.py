from datetime import time
from enum import Enum

import numpy as np
from pydantic import BaseModel
from typing import  Optional, Tuple, Dict, List

#? Maybe consider using these as additional weight multipliers?
class TutorTypes(str, Enum):
    professional = 'professional'
    paraprofessional = 'paraprofessional'
    nonprofessional = 'nonprofessional'

"""
    @ Describe the class here when done
"""
class Tutor(BaseModel):
    id: str

    """
        Delivery Characteristics (weekly)
    """
    availability_schedule: Dict[str, List[Tuple[time, time]]]

    """
        Curriculum Characteristics
    """
    # * This is dynamic but assume to be the same since this will be queried from the model based on the student's needs... consider filtering nalang siguro when the need arises?
    competencies: Dict[str, float] = None
    competency_filter: List[str] = None
    """
        Tutoring Characteristics
    """
    tutor_type: TutorTypes
    teaching_style: Dict[str, float] = {"visual": 0, "auditory": 0, "read_write": 0, "kinesthetic": 0}
    # https://www.gesis.org/en/services/planning-studies-and-collecting-data/items-scales/bfi-10
    # * Note: Openness and Conscientiousness are some of the most beneficial personalities in GENERAL
    personality: Dict[str, float] = {"openness": 0, "conscientiousness": 0, "extraversion": 0, "agreeableness": 0, "neuroticism": 0}

    # Ratings
    student_ratings: Dict[str, float]

    def extract_features(self) -> np.ndarray:
        teaching_style_features = np.array([
            self.teaching_style.get("visual", 0),
            self.teaching_style.get("auditory", 0),
            self.teaching_style.get("read_write", 0),
            self.teaching_style.get("kinesthetic", 0)
        ])

        personality_features = np.array([
            self.personality.get("openness", 0),
            self.personality.get("conscientiousness", 0),
            self.personality.get("extraversion", 0),
            self.personality.get("agreeableness", 0),
            self.personality.get("neuroticism", 0)
        ])

        # ? ASSUMED TO BE THE SAME SET AS TUTORS, handle this if ever the need arises
        competency_features = self.get_filtered_competencies()
        return np.concatenate((teaching_style_features * 0.5, personality_features * 0.5, competency_features * 10))

    def set_competency_filter(self, filter_list: List[str]) -> None:
        self.competency_filter = filter_list

    def get_filtered_competencies(self) -> np.array:
        competency_features = np.array([])
        if self.competencies:
            if self.competency_filter is None:
                # If filter is None, use all competencies
                competency_features = np.array(list(self.competencies.values()))
            else:
                # Use only filtered competencies
                competency_features = np.array([self.competencies.get(comp, 0) for comp in self.competency_filter])

        return competency_features

    
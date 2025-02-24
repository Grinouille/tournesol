"""
The public dataset library.
"""
from django.db.models import QuerySet


def get_comparisons_data(poll_name: str) -> QuerySet:
    """
    Retrieve the public comparisons from the database and return a
    non-evaluated Django `RawQuerySet`.

    A comparison is represented by a rating given by a user for a specific
    criterion and a couple of entities:

        User X (Entity A, Entity B) X Given criteria rating
    """
    from tournesol.models.comparisons import Comparison  # pylint: disable=import-outside-toplevel

    return Comparison.objects.raw(
        """
        SELECT
            tournesol_comparison.id,

            core_user.username,
            entity_1.uid AS uid_a,
            entity_2.uid AS uid_b,
            comparisoncriteriascore.criteria,
            comparisoncriteriascore.weight,
            comparisoncriteriascore.score

        FROM tournesol_comparison

        -- this JOIN allows to filter on the desired poll
        JOIN tournesol_poll
          ON tournesol_poll.id = tournesol_comparison.poll_id

        JOIN core_user
          ON core_user.id = tournesol_comparison.user_id

        JOIN tournesol_comparisoncriteriascore AS comparisoncriteriascore
          ON comparisoncriteriascore.comparison_id = tournesol_comparison.id

        JOIN tournesol_entity AS entity_1
          ON entity_1.id = tournesol_comparison.entity_1_id

        JOIN tournesol_entity AS entity_2
          ON entity_2.id = tournesol_comparison.entity_2_id

        -- this JOIN allows to filter by public ratings for the entity_1
        -- the poll has been already filtered, no need to filter it again
        JOIN tournesol_contributorrating AS rating_1
          ON rating_1.entity_id = tournesol_comparison.entity_1_id
         AND rating_1.user_id = tournesol_comparison.user_id

        -- this JOIN allows to filter by public ratings for the entity_2
        -- the poll has been already filtered, no need to filter it again
        JOIN tournesol_contributorrating AS rating_2
          ON rating_2.entity_id = tournesol_comparison.entity_2_id
         AND rating_2.user_id = tournesol_comparison.user_id

        WHERE tournesol_poll.name = %(poll_name)s
          -- keep only public ratings
          AND rating_1.is_public = true
          AND rating_2.is_public = true
        """,
        {"poll_name": poll_name},
    )


def get_users_data(poll_name: str) -> QuerySet:
    """
    Retrieve the users with at least one public comparison and return a
    non-evaluated Django `RawQuerySet`.
    """
    from core.models import User  # pylint: disable=import-outside-toplevel

    return User.objects.raw(
        """
        SELECT DISTINCT
            core_user.id,
            core_user.username,
            core_user.trust_score

        FROM core_user

        -- all the conditions below are there only to limit the result
        -- to users who made public comparisons. They should be similar
        -- to the ones in `get_dataset`

        JOIN tournesol_comparison
          ON tournesol_comparison.user_id = core_user.id

        JOIN tournesol_poll
          ON tournesol_poll.id = tournesol_comparison.poll_id

        JOIN tournesol_entity AS entity_1
          ON entity_1.id = tournesol_comparison.entity_1_id

        JOIN tournesol_entity AS entity_2
          ON entity_2.id = tournesol_comparison.entity_2_id

        JOIN tournesol_contributorrating AS rating_1
          ON rating_1.entity_id = tournesol_comparison.entity_1_id
         AND rating_1.user_id = tournesol_comparison.user_id

        JOIN tournesol_contributorrating AS rating_2
          ON rating_2.entity_id = tournesol_comparison.entity_2_id
         AND rating_2.user_id = tournesol_comparison.user_id

        WHERE tournesol_poll.name = %(poll_name)s
          -- keep only public ratings
          AND rating_1.is_public = true
          AND rating_2.is_public = true

        ORDER BY core_user.username
        """,
        {"poll_name": poll_name},
    )


def get_individual_criteria_scores_data(poll_name: str) -> QuerySet:
    """
    Retrieve the individual criteria scores computed for each public rating
    and return a non-evaluated Django `RawQuerySet`.

    An individual criteria score is a score computed by the algorithm for
    a specific criterion, previously rated by a user for a specific entity.

        User X Entity X Computed criteria score
    """
    from tournesol.models import (  # pylint: disable=import-outside-toplevel
        ContributorRatingCriteriaScore,
    )

    return ContributorRatingCriteriaScore.objects.raw(
        """
        SELECT
            tournesol_contributorratingcriteriascore.id,
            core_user.username,
            tournesol_entity.uid,
            tournesol_contributorratingcriteriascore.criteria,
            tournesol_contributorratingcriteriascore.score,
            tournesol_contributorratingcriteriascore.voting_right

        FROM core_user

        JOIN tournesol_contributorrating
          ON tournesol_contributorrating.user_id = core_user.id

        JOIN tournesol_poll
          ON tournesol_poll.id = tournesol_contributorrating.poll_id

        JOIN tournesol_entity
          ON tournesol_entity.id = tournesol_contributorrating.entity_id

        JOIN tournesol_contributorratingcriteriascore
          ON tournesol_contributorrating.id
           = tournesol_contributorratingcriteriascore.contributor_rating_id

        WHERE tournesol_poll.name = %(poll_name)s
          AND tournesol_contributorrating.is_public

        -- this query can be significantly faster by keeping only the username
        -- in the ORDER BY clause

        ORDER BY
            core_user.username ASC,
            tournesol_entity.uid ASC,
            tournesol_contributorratingcriteriascore.criteria ASC
        """,
        {"poll_name": poll_name},
    )

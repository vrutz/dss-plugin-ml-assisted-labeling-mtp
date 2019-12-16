import numpy as np


def random_sampling(X, idx_labeled=None, n_instances=1):
    """
    Random sampling query strategy. Selects instances randomly
    
    Args:
        X: The pool of samples to query from.
        idx_labeled: Samples to remove because they have been already labeled
        n_instances: Number of samples to be queried.

    Returns:
        The indices of the instances from X chosen to be labeled;
        the instances from X chosen to be labeled.
        
    Note:
        This class is handy for testing against naive method
    """
    unlabeled = np.ones(n_instances)
    if idx_labeled is not None:
        unlabeled[idx_labeled] = 0
    index = np.where(unlabeled)[0]
    np.random.shuffle(index)
    index = index[:n_instances]
    
    return index, unlabeled[index]